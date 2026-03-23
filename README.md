<p align="center">
  <img src="packages/docs/public/logo.svg" width="80" alt="yeelight-client" />
</p>

<h1 align="center">yeelight-client</h1>

<p align="center">
  TypeScript library for controlling Yeelight smart lights over LAN
</p>

<p align="center">
  <a href="https://github.com/NumberOneBot/yeelight-client/actions/workflows/ci.yml"><img src="https://github.com/NumberOneBot/yeelight-client/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/yeelight-client"><img src="https://img.shields.io/npm/v/yeelight-client" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/yeelight-client"><img src="https://img.shields.io/npm/dm/yeelight-client" alt="npm downloads" /></a>
  <a href="https://github.com/NumberOneBot/yeelight-client/blob/main/LICENSE"><img src="https://img.shields.io/github/license/NumberOneBot/yeelight-client" alt="license" /></a>
  <a href="https://github.com/NumberOneBot/yeelight-client"><img src="https://img.shields.io/badge/TypeScript-5.7-blue" alt="TypeScript" /></a>
</p>

---

> **Zero-dependency** TypeScript library for Yeelight devices. SSDP discovery, dual-channel control, color flows, segment lighting — all over your local network.

## Features

- **Auto-discovery** — find devices on your LAN via SSDP multicast
- **Direct connection** — connect by IP when you know the address
- **Dual-channel** — independent control of main and background lights
- **Segment control** — left/right colors on lamp15 (YLTD003)
- **Color flows** — built-in presets (pulse, strobe, candle, sunrise, color cycle) and a chainable FlowBuilder
- **Full state** — read power, brightness, color temp, RGB, flow status
- **Real-time events** — property change notifications pushed from the device
- **ESM + CJS** — works everywhere, ships with TypeScript declarations
- **Zero dependencies** — only Node.js built-ins (`net`, `dgram`, `events`, `os`)

## Requirements

- Node.js 18+
- LAN Control enabled on your Yeelight device (Yeelight app → device settings → LAN Control)

## Install

```bash
npm install yeelight-client
```

```bash
pnpm add yeelight-client
```

```bash
yarn add yeelight-client
```

## Quick Start

```ts
import { YeelightDevice } from 'yeelight-client'

// Discover devices on the network
const devices = await YeelightDevice.discover({ timeout: 3000 })
const device = devices[0]
await device.connect()

// Control the main light
await device.main.setPower(true)
await device.main.setBrightness(80)
await device.main.setColorTemp(4000)
await device.main.setRGB(255, 100, 0)

device.disconnect()
```

## Usage

### Connect by IP

```ts
const device = await YeelightDevice.connect('192.168.1.42')
```

When connecting by IP, capabilities are auto-detected via a property probe.

### Dual-Channel Devices

Some Yeelight devices (ceiling lights, desk lamps) have a background channel:

```ts
if (device.background) {
  await device.background.setRGB(0, 100, 255)
  await device.background.setBrightness(50)
}
```

### Segment Control

The lamp15 (YLTD003) supports independent left/right segment colors:

```ts
if (device.capabilities.hasSegments) {
  await device.setSegments([255, 0, 0], [0, 0, 255])
}
```

### Color Flows

Built-in presets for common animations:

```ts
import { Flow } from 'yeelight-client'

await device.main.startFlow(Flow.pulse(255, 0, 0, { count: 3, duration: 400 }))
await device.main.startFlow(Flow.strobe(0, 255, 0, { count: 10 }))
await device.main.startFlow(Flow.colorCycle({ duration: 1000 }))
await device.main.startFlow(Flow.candle())
await device.main.startFlow(Flow.sunrise(5000))
```

Build custom flows with the chainable API:

```ts
const flow = Flow.builder()
  .rgb(255, 0, 0, { duration: 500, brightness: 100 })
  .colorTemp(4000, { duration: 500, brightness: 80 })
  .sleep(200)
  .repeat(0) // loop forever
  .onEnd('recover') // restore previous state on stop
  .build()

await device.main.startFlow(flow)
await device.main.stopFlow()
```

### Transition Options

All setter methods accept an optional second argument:

```ts
await device.main.setBrightness(50, { effect: 'smooth', duration: 1000 })
await device.main.setRGB(255, 0, 0, { effect: 'sudden' })
```

Default: `{ effect: 'smooth', duration: 300 }`.

### Events

```ts
device.on('props', (props) => {
  console.log('State changed:', props)
})

device.on('disconnect', () => {
  console.log('Device disconnected')
})
```

| Event        | Payload                 | Description                     |
| ------------ | ----------------------- | ------------------------------- |
| `props`      | `Partial<ChannelState>` | Device pushed a property change |
| `disconnect` | —                       | Connection lost or closed       |
| `tx`         | `string`                | Outgoing JSON-RPC frame (debug) |
| `rx`         | `string`                | Incoming JSON-RPC frame (debug) |

### Reading State

```ts
const state = await device.main.getState()
// { power: true, brightness: 80, colorTemp: 4000, rgb: null, flowing: false }
```

### Raw Properties

Query any Yeelight property by its protocol name:

```ts
const raw = await device.getRawProps([
  'power',
  'bright',
  'ct',
  'rgb',
  'color_mode'
])
// { power: 'on', bright: '80', ct: '4000', rgb: '16737280', color_mode: '2' }
```

### Capabilities

```ts
device.capabilities
// {
//   hasBackground: true,
//   hasSegments: false,
//   main: { hasColor: true, hasColorTemp: true, hasFlow: true },
//   background: { hasColor: true, hasColorTemp: true, hasFlow: true }
// }
```

## API

### `YeelightDevice`

|            | Signature                                                          | Description                                     |
| ---------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| **Static** | `discover(opts?: { timeout?: number }): Promise<YeelightDevice[]>` | Find devices via SSDP (default timeout: 3000ms) |
| **Static** | `connect(ip: string, port?: number): Promise<YeelightDevice>`      | Connect directly (default port: 55443)          |
|            | `connect(): Promise<void>`                                         | Reconnect a disconnected device                 |
|            | `disconnect(): void`                                               | Close the connection                            |
|            | `isConnected(): boolean`                                           | Connection status                               |
|            | `setSegments(left, right): Promise<void>`                          | Set left/right segment colors (lamp15)          |
|            | `getRawProps(props: string[]): Promise<Record<string, string>>`    | Query raw Yeelight properties                   |

**Properties:** `id`, `ip`, `model`, `name`, `support`, `capabilities`, `main`, `background`

### `LightChannel`

| Method                        | Description                            |
| ----------------------------- | -------------------------------------- |
| `setPower(on, opts?)`         | Turn on/off                            |
| `toggle()`                    | Toggle power                           |
| `setBrightness(1–100, opts?)` | Set brightness                         |
| `setColorTemp(kelvin, opts?)` | Color temperature (1700–6500 K)        |
| `setRGB(r, g, b, opts?)`      | RGB color (0–255 each)                 |
| `setHSV(hue, sat, opts?)`     | HSV color (hue 0–359, sat 0–100)       |
| `startFlow(flow)`             | Start a color flow animation           |
| `stopFlow()`                  | Stop the current flow                  |
| `setDefault()`                | Save current state as power-on default |
| `getState()`                  | Read `ChannelState`                    |

Methods that require specific hardware throw `UnsupportedError` if the capability is missing.

### `Flow`

| Factory                       | Description                              |
| ----------------------------- | ---------------------------------------- |
| `Flow.pulse(r, g, b, opts?)`  | Pulsing RGB (default: 3×, 500ms)         |
| `Flow.strobe(r, g, b, opts?)` | Fast strobe (default: 10×, 50ms)         |
| `Flow.colorCycle(opts?)`      | Rainbow loop (default: 1000ms per step)  |
| `Flow.candle()`               | Warm flicker (1700–1900 K)               |
| `Flow.sunrise(durationMs)`    | Gradual warm-up to daylight              |
| `Flow.builder()`              | Returns a `FlowBuilder` for custom flows |

### `FlowBuilder`

Chainable: `.rgb()` → `.colorTemp()` → `.sleep()` → `.repeat()` → `.onEnd()` → `.build()`

### Error Classes

| Class              | When                                         |
| ------------------ | -------------------------------------------- |
| `UnsupportedError` | Device/channel doesn't support the operation |
| `ConnectionError`  | Network failure, timeout, or disconnection   |
| `DeviceError`      | Device rejected the RPC call (has `.code`)   |

### Types

```ts
interface ChannelState {
  power: boolean
  brightness: number // 1–100
  colorTemp: number | null // Kelvin
  rgb: [number, number, number] | null // [R, G, B]
  flowing: boolean
}

interface TransitionOptions {
  effect?: 'smooth' | 'sudden'
  duration?: number // ms
}

interface Capabilities {
  hasBackground: boolean
  hasSegments: boolean
  main: ChannelCapabilities
  background: ChannelCapabilities | null
}

interface ChannelCapabilities {
  hasColor: boolean
  hasColorTemp: boolean
  hasFlow: boolean
}
```

---

## Packages

| Package                                                            | Description                                                 |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| [`yeelight-client`](https://www.npmjs.com/package/yeelight-client) | Core library — this package                                 |
| [`yeelight-cli`](https://www.npmjs.com/package/yeelight-cli)       | Terminal tool (`ylc`) — interactive TUI + one-shot commands |

## CLI

The companion `yeelight-cli` package provides a terminal tool:

```bash
npm install -g yeelight-cli
```

Or download a precompiled binary from [Releases](https://github.com/NumberOneBot/yeelight-client/releases).

```bash
ylc discover                         # find devices on the network
ylc interactive                      # TUI with device picker + controls
ylc status --ip 192.168.1.42         # show device state
ylc power on                         # turn on
ylc brightness 50 --duration 1000    # set brightness with transition
ylc ct 3000                          # color temperature
ylc color "#ff6400"                # hex color
ylc color "#ff640080"              # hex with alpha → brightness
ylc segment "#ff0000" "#0000ff"  # lamp15 left/right
ylc power on --bg                    # background channel
```

## Development

```bash
pnpm install

pnpm dev                                    # library watch mode
pnpm build                                  # build library (ESM + CJS + DTS)
pnpm --filter yeelight-cli dev              # CLI dev
pnpm --filter yeelight-client-docs dev      # docs dev server
```

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add something'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE) © Alex Strelets
