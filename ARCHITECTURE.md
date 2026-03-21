# Library Architecture

## Goals

This codebase will become a TypeScript library consumed by:

- A **CLI executable** — runs one command at a time against a discovered device
- A **desktop app** (macOS / Windows) — interactive control with live state display
- A **third project** (TBD)

All downstream projects are on the Node/TypeScript stack.

---

## Core Design Decision: Channel Abstraction

Yeelight devices split naturally into two groups based on physical structure:

| Group       | Devices                                        | Channels |
| ----------- | ---------------------------------------------- | -------- |
| Single-zone | mono, color, ceiling, strip, lamp1/2/4, bslamp | 1        |
| Dual-zone   | lamp15, ceiling4/10/19/20                      | 2        |

Rather than a class hierarchy, the model is **device → channels**, where each channel describes its own capabilities independently.

```
YeelightDevice
├── main: LightChannel         always present
└── background: LightChannel | null   dual-zone devices only
```

This means consumer code never needs to know or check the device model — it checks the channel.

---

## File Structure

```
src/
  index.ts          public re-export of everything
  types.ts          shared interfaces and enums
  errors.ts         typed error classes
  discovery.ts      SSDP device discovery
  transport.ts      TCP connection, send/recv, command queue
  capabilities.ts   parses support[] from SSDP → DeviceCapabilities
  channel.ts        LightChannel class
  device.ts         YeelightDevice facade
  flow.ts           Flow builder + presets
```

---

## Types (`types.ts`)

```typescript
interface DeviceCapabilities {
  hasColor: boolean // set_rgb / set_hsv present in support[]
  hasColorTemp: boolean // set_ct_abx present
  colorTempRange: [number, number]
  hasFlow: boolean // start_cf present
  hasMusicMode: boolean // set_music present
  hasBackground: boolean // any bg_* present
  hasSegments: boolean // set_segment_rgb present (lamp15 only so far)
  background?: {
    hasColor: boolean
    hasColorTemp: boolean
    colorTempRange: [number, number]
  }
  supportedMethods: string[] // raw list, for passthrough use
}

interface ChannelCapabilities {
  hasColor: boolean
  hasColorTemp: boolean
  colorTempRange: [number, number]
  hasFlow: boolean
}

interface TransitionOptions {
  effect?: 'smooth' | 'sudden' // default: 'smooth'
  duration?: number // milliseconds, default: 300, minimum: 30
}

interface ChannelState {
  power: boolean
  brightness: number // 1–100
  colorTemp: number | null // Kelvin, null if channel has no CT
  rgb: [number, number, number] | null // null if channel has no color
  flowing: boolean
}

interface DiscoveredDevice {
  id: string
  ip: string
  port: number
  model: string
  name: string
  capabilities: DeviceCapabilities
  initialState: Partial<ChannelState>
}
```

---

## Errors (`errors.ts`)

```typescript
class UnsupportedError extends Error {
  // Thrown when calling a method the channel does not support.
  // e.g. setRGB() on a CT-only channel.
  // Caught at dev time, not at runtime for end users.
}

class ConnectionError extends Error {
  // Thrown when TCP connect/send fails.
}

class DeviceError extends Error {
  // Thrown when the device responds with an error object.
  code: number
  // e.g. {"error": {"code": -1, "message": "unsupported method"}}
}
```

---

## Transport (`transport.ts`)

Owns the TCP socket. Responsible for:

- Connecting and reconnecting
- Serializing commands to `JSON\r\n`
- Maintaining a `Map<id, resolver>` for pending responses
- Splitting incoming data on `\r\n` (handles partial reads and batched lines)
- Routing `{"method":"props"}` push notifications to an event emitter
- Buffering a command queue to enforce safe send ordering

```typescript
class Transport {
  connect(ip: string, port: number): Promise<void>
  disconnect(): void
  isConnected(): boolean
  send(method: string, params: (string | number)[]): Promise<RpcResponse>
  on(event: 'props', listener: (props: Record<string, string>) => void): this
  on(event: 'disconnect', listener: () => void): this
}
```

`Transport` has no knowledge of channels, devices, or capabilities. It only speaks raw RPC.

---

## Capabilities (`capabilities.ts`)

Stateless module. Parses the `support` string from SSDP into a `DeviceCapabilities` struct.

```typescript
function parseCapabilities(supportString: string): DeviceCapabilities
```

Also provides a helper to derive per-channel capabilities:

```typescript
function mainChannelCapabilities(caps: DeviceCapabilities): ChannelCapabilities
function backgroundChannelCapabilities(
  caps: DeviceCapabilities
): ChannelCapabilities | null
```

This is the only place where the mapping from raw method names to capability flags lives.

---

## LightChannel (`channel.ts`)

The primary unit of interaction. Wraps a `Transport` with a command prefix (empty string for main, `"bg_"` for background) and exposes a typed API.

```typescript
class LightChannel {
  readonly type: 'main' | 'background'
  readonly capabilities: ChannelCapabilities

  // Always available
  setPower(on: boolean, opts?: TransitionOptions): Promise<void>
  toggle(opts?: TransitionOptions): Promise<void>
  setBrightness(value: number, opts?: TransitionOptions): Promise<void>

  // Requires capabilities.hasColorTemp — throws UnsupportedError otherwise
  setColorTemp(kelvin: number, opts?: TransitionOptions): Promise<void>

  // Requires capabilities.hasColor — throws UnsupportedError otherwise
  setRGB(
    r: number,
    g: number,
    b: number,
    opts?: TransitionOptions
  ): Promise<void>
  setHSV(
    hue: number,
    saturation: number,
    opts?: TransitionOptions
  ): Promise<void>

  // Requires capabilities.hasFlow — throws UnsupportedError otherwise
  startFlow(flow: Flow): Promise<void>
  stopFlow(): Promise<void>

  getState(): Promise<ChannelState>
}
```

Calling `setRGB()` on a CT-only channel throws `UnsupportedError` immediately — this surfaces misuse at development time rather than silently doing nothing.

---

## YeelightDevice (`device.ts`)

Facade over `Transport` and the two `LightChannel` instances. The only class consumers need to import for typical use.

```typescript
class YeelightDevice {
  // Discovery and connection
  static discover(opts?: { timeout?: number }): Promise<YeelightDevice[]>
  static connect(ip: string, port?: number): Promise<YeelightDevice>

  // Identity
  readonly id: string
  readonly ip: string
  readonly model: string // "lamp15", "color1", etc.
  readonly name: string
  readonly capabilities: DeviceCapabilities

  // Channels
  readonly main: LightChannel
  readonly background: LightChannel | null // null on single-zone devices

  // Connection lifecycle
  connect(): Promise<void>
  disconnect(): void
  isConnected(): boolean

  // Push state updates from the device
  // Needed for desktop app to avoid polling
  on(event: 'props', listener: (props: Partial<ChannelState>) => void): this
  on(event: 'disconnect', listener: () => void): this
  off(event: string, listener: Function): this
}
```

### lamp15-specific: segment control

`lamp15` exposes `set_segment_rgb` which controls the left and right halves of the rear strip independently. This doesn't fit the `LightChannel` model cleanly (it requires two colors at once). It will be exposed as an extension method directly on `YeelightDevice`, gated by `capabilities.hasSegments`:

```typescript
// Only present when capabilities.hasSegments === true
setSegments(
  left: [number, number, number],
  right: [number, number, number]
): Promise<void>
```

---

## Flow Builder (`flow.ts`)

Builds the `start_cf` / `bg_start_cf` flow expression string. Exposes a fluent builder and common presets.

```typescript
class FlowBuilder {
  repeat(count: number): this // 0 = infinite
  onEnd(action: 'recover' | 'stay' | 'off'): this

  rgb(
    r: number,
    g: number,
    b: number,
    opts: { duration: number; brightness?: number }
  ): this
  colorTemp(
    kelvin: number,
    opts: { duration: number; brightness?: number }
  ): this
  sleep(ms: number): this

  build(): Flow
}

class Flow {
  static builder(): FlowBuilder

  // Presets
  static pulse(
    r: number,
    g: number,
    b: number,
    opts?: { count?: number; duration?: number }
  ): Flow
  static strobe(
    r: number,
    g: number,
    b: number,
    opts?: { count?: number }
  ): Flow
  static colorCycle(opts?: { duration?: number }): Flow
  static candle(): Flow
  static sunrise(durationMs: number): Flow // CT 1700→5000, brightness 1→100
}
```

---

## Public API (`index.ts`)

```typescript
export { YeelightDevice } from './device.js'
export { Flow, FlowBuilder } from './flow.js'
export { UnsupportedError, ConnectionError, DeviceError } from './errors.js'
export type {
  DeviceCapabilities,
  ChannelCapabilities,
  ChannelState,
  TransitionOptions,
  DiscoveredDevice
} from './types.js'
```

`LightChannel` is not exported as a constructable class — consumers get instances only through `device.main` / `device.background`. The type is exported for annotation purposes.

---

## Device Compatibility Matrix

| Device type             | `main` capabilities | `background` | `setSegments` |
| ----------------------- | ------------------- | ------------ | ------------- |
| `mono`                  | brightness only     | —            | —             |
| `ct_bulb`, `ceiling1`–N | CT                  | —            | —             |
| `color`, `strip1`       | RGB + CT            | —            | —             |
| `bslamp1`–3             | RGB + CT            | —            | —             |
| `ceiling4/10/19/20`     | CT                  | RGB + CT     | —             |
| `lamp15` (YLTD003)      | CT                  | RGB + CT     | ✅            |

---

## Implementation Order

1. `types.ts` + `errors.ts` — no dependencies
2. `capabilities.ts` — pure function, no side effects
3. `transport.ts` — TCP only, no domain knowledge
4. `channel.ts` — depends on transport and capabilities
5. `device.ts` — assembles everything, owns discovery
6. `flow.ts` — independent, pure builder
7. `index.ts` — re-export
