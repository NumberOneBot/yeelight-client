<p align="center">
  <img src="https://raw.githubusercontent.com/NumberOneBot/yeelight-client/main/packages/docs/public/logo.svg" width="80" alt="yeelight-cli" />
</p>

<h1 align="center">yeelight-cli</h1>

<p align="center">
  Terminal tool for controlling Yeelight smart lights over LAN
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/yeelight-cli"><img src="https://img.shields.io/npm/v/yeelight-cli" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/yeelight-cli"><img src="https://img.shields.io/npm/dm/yeelight-cli" alt="npm downloads" /></a>
  <a href="https://github.com/NumberOneBot/yeelight-client/blob/main/LICENSE"><img src="https://img.shields.io/github/license/NumberOneBot/yeelight-client" alt="license" /></a>
</p>

---

> One-shot commands and an interactive TUI for Yeelight devices. Powered by [`yeelight-client`](https://www.npmjs.com/package/yeelight-client).

## Install

```bash
npm install -g yeelight-cli
```

Or download a precompiled binary from [Releases](https://github.com/NumberOneBot/yeelight-client/releases).

## Requirements

- Node.js 18+ (or use the standalone binary)
- LAN Control enabled on your Yeelight device (Yeelight app → device settings → LAN Control)

## Commands

```
ylc discover                        Find devices on the network
ylc status                          Show current device state
ylc interactive                     Interactive device control (TUI)
ylc power <on|off>                  Turn on or off
ylc brightness <1–100>              Set brightness
ylc ct <1700–6500>                  Color temperature in Kelvin
ylc color <#hex | r g b>            Set RGB color
ylc segment <left> <right>          Left/right segment colors (lamp15)
```

## Options

| Flag              | Description                              |
| ----------------- | ---------------------------------------- |
| `--bg`            | Target background channel                |
| `--ip <address>`  | Device IP (auto-discover if omitted)     |
| `--duration <ms>` | Transition duration in ms (default: 0)   |
| `--timeout <ms>`  | Discovery timeout in ms (default: 3000)  |
| `--raw`           | Dump all raw property values (status)    |
| `--commands`      | Show supported commands (status, via SSDP)|
| `--debug`         | Log tx/rx frames to debug.log (interactive)|
| `-h, --help`      | Show help                                |
| `-V, --version`   | Show version                             |

## Examples

```bash
# Discover devices
ylc discover

# Interactive TUI — pick a device and control it
ylc interactive

# Set color with smooth transition
ylc color "#ff6400" --duration 1000

# Hex with alpha → sets brightness too
ylc color "#ff640080"

# Control background channel
ylc power on --bg
ylc brightness 50 --bg

# Connect by IP (skip discovery)
ylc status --ip 192.168.1.42

# Lamp15 segment colors
ylc segment "#ff0000" "#0000ff"
```

## Core Library

This CLI is built on top of [`yeelight-client`](https://www.npmjs.com/package/yeelight-client) — a zero-dependency TypeScript library for Yeelight device control. Use it to build your own integrations.

## License

[MIT](https://github.com/NumberOneBot/yeelight-client/blob/main/LICENSE) © Alex Strelets
