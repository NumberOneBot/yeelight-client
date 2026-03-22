<p align="center">
  <img src="packages/docs/public/logo.svg" width="80" alt="yeelight-client" />
</p>

<h1 align="center">yeelight-client</h1>

<p align="center">
  TypeScript library + CLI for controlling Yeelight smart lights over LAN
</p>

<p align="center">
  <a href="https://github.com/NumberOneBot/yeelight-client/blob/main/LICENSE"><img src="https://img.shields.io/github/license/NumberOneBot/yeelight-client" alt="license" /></a>
</p>

---

## Packages

| Package           | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| `yeelight-client` | Core library — device discovery, connection, light control |
| `yeelight-cli`    | Terminal tool (`ylc` command)                              |

## Requirements

- Node.js 18+ (library) / Bun 1+ (CLI)
- LAN Control enabled on your Yeelight device (Yeelight app → device settings → LAN Control)

---

## Library

### Install

```bash
npm install yeelight-client
```

### Usage

```ts
import { YeelightDevice } from 'yeelight-client'

// Auto-discover on the LAN
const [device] = await YeelightDevice.discover({ timeout: 3000 })
await device.connect()

// Main channel
await device.main.setPower(true)
await device.main.setBrightness(80)
await device.main.setColorTemp(4000) // Kelvin
await device.main.setRGB(255, 100, 0)
await device.main.setHSV(30, 100)

// Background channel (dual-zone devices)
if (device.background) {
  await device.background.setRGB(0, 100, 255)
}

// Segment control (lamp15 / YLTD003)
if (device.capabilities.hasSegments) {
  await device.setSegments([255, 0, 0], [0, 0, 255]) // left red, right blue
}

device.disconnect()
```

### Connect by IP

```ts
const device = await YeelightDevice.connect('192.168.1.42')
```

### Color flow

```ts
import { YeelightDevice, Flow } from 'yeelight-client'

// Pulse red 3 times
const flow = Flow.pulse(255, 0, 0, { count: 3, duration: 400 })
await device.main.startFlow(flow)

// Custom flow with FlowBuilder
const flow = Flow.builder()
  .rgb(255, 0, 0, { duration: 500, brightness: 100 })
  .colorTemp(4000, { duration: 500, brightness: 80 })
  .sleep(200)
  .build({ count: 0, action: 'recover' }) // loop forever, restore on stop

await device.main.startFlow(flow)
await device.main.stopFlow()
```

### Events

```ts
device.on('props', (props) => {
  console.log('State changed:', props)
})

device.on('disconnect', () => {
  console.log('Device disconnected')
})
```

### API Reference

| Method                              | Description                                 |
| ----------------------------------- | ------------------------------------------- |
| `YeelightDevice.discover(opts?)`    | Discover devices on the LAN via SSDP        |
| `YeelightDevice.connect(ip, port?)` | Connect directly by IP                      |
| `device.main`                       | Main light channel (`LightChannel`)         |
| `device.background`                 | Background channel or `null`                |
| `device.setSegments(left, right)`   | Independent left/right colors (lamp15 only) |
| `device.disconnect()`               | Close the connection                        |

**`LightChannel` methods:**

| Method                        | Description                         |
| ----------------------------- | ----------------------------------- |
| `setPower(on, opts?)`         | Turn on/off                         |
| `toggle()`                    | Toggle power                        |
| `setBrightness(1–100, opts?)` | Set brightness                      |
| `setColorTemp(kelvin, opts?)` | Set color temperature (1700–6500 K) |
| `setRGB(r, g, b, opts?)`      | Set RGB color                       |
| `setHSV(hue, sat, opts?)`     | Set color via HSV                   |
| `startFlow(flow)`             | Start a color flow animation        |
| `stopFlow()`                  | Stop animation                      |
| `getState()`                  | Read current state                  |

All methods accept an optional `TransitionOptions` — `{ effect: 'smooth' \| 'sudden', duration: number }`.

---

## CLI

### Install

```bash
npm install -g yeelight-cli
```

Or download a precompiled binary from [Releases](https://github.com/NumberOneBot/yeelight-client/releases).

### Commands

```
Usage: ylc <command> [options]

Commands:
  discover                        Discover devices on the network
  status                          Show current device state
  interactive                     Interactive device control (TUI)
  power        <on|off>           Turn on or off
  brightness   <1–100>            Set brightness
  ct           <kelvin>           Set color temperature (1700–6500)
  color        <#hex | r g b>     Set RGB color
  segment      <left> <right>     Left/right segment colors (lamp15)

Options:
  --bg               Target background channel
  --ip <address>     Device IP (auto-discover if omitted)
  --duration <ms>    Transition duration in ms (default: 0)
  --timeout <ms>     Discovery timeout in ms (default: 3000)
```

### Examples

```bash
ylc discover
ylc interactive
ylc status --ip 192.168.1.42
ylc power on
ylc brightness 50 --duration 1000
ylc ct 3000
ylc color 255 100 0
ylc color "#ff6400"
ylc color "#ff640080"          # alpha channel → brightness
ylc segment "#ff0000" "#0000ff"
ylc power on --bg              # background channel
```

---

## Development

```bash
pnpm install

pnpm dev                                    # library watch mode
pnpm --filter yeelight-cli dev              # CLI dev
pnpm --filter yeelight-client-docs dev      # docs dev server
pnpm build                                  # build library
pnpm --filter yeelight-cli build:win        # compile Windows binary (requires ImageMagick)
```

## License

MIT
