# Yeelight LAN Protocol — Research Notes

> Accumulated from empirical testing, official spec PDF, python-yeelight, Home Assistant, and community sources.
> Last updated: March 2026

---

## Table of Contents

1. [Protocol Overview](#1-protocol-overview)
2. [Device Discovery (SSDP)](#2-device-discovery-ssdp)
3. [Command Format](#3-command-format)
4. [Device Model Registry](#4-device-model-registry)
5. [Capability System](#5-capability-system)
6. [Channel Architecture](#6-channel-architecture)
7. [Commands Reference](#7-commands-reference)
8. [Flow Animations](#8-flow-animations)
9. [Music Mode](#9-music-mode)
10. [UDP / Chroma Mode](#10-udp--chroma-mode)
11. [lamp15 (YLTD003) — Deep Dive](#11-lamp15-yltd003--deep-dive)
12. [Known Limitations and Quirks](#12-known-limitations-and-quirks)
13. [Ecosystem: Other Projects](#13-ecosystem-other-projects)
14. [LAN Control Availability](#14-lan-control-availability)

---

## 1. Protocol Overview

Yeelight's LAN control protocol is a **plain-text JSON-RPC over TCP** interface available on any Yeelight WiFi device with LAN Control enabled.

| Property          | Value                           |
| ----------------- | ------------------------------- |
| Transport         | TCP                             |
| Port              | `55443`                         |
| Encoding          | UTF-8 plain text, no encryption |
| Message delimiter | `\r\n`                          |
| Discovery         | SSDP over UDP multicast         |
| Rate limit        | ~10 commands/sec (TCP mode)     |

LAN control must be explicitly enabled in the Yeelight mobile app:
**Device → Settings → LAN Control**

The protocol is documented in the official PDF:
`https://www.yeelight.com/download/Yeelight_Inter-Operation_Spec.pdf`
However, the spec is incomplete — several commands (notably `set_segment_rgb`) are not documented.

---

## 2. Device Discovery (SSDP)

Devices are discovered via SSDP (UPnP-style multicast).

**M-SEARCH request** — send as UDP to `239.255.255.250:1982`:

```
M-SEARCH * HTTP/1.1\r\n
HOST: 239.255.255.250:1982\r\n
MAN: "ssdp:discover"\r\n
ST: wifi_bulb\r\n
\r\n
```

**Response** — HTTP/1.1 headers. Relevant fields:

| Header     | Example                        | Description                               |
| ---------- | ------------------------------ | ----------------------------------------- |
| `Location` | `yeelight://192.168.1.5:55443` | IP and port for TCP connection            |
| `id`       | `0x000000000484af7d`           | Unique device identifier (hex)            |
| `model`    | `lamp15`                       | Logical model name (not hardware SKU)     |
| `name`     | `My Light Bar`                 | User-assigned name                        |
| `power`    | `on`                           | Current power state                       |
| `bright`   | `100`                          | Current brightness (1–100)                |
| `ct`       | `4000`                         | Current color temperature (Kelvin)        |
| `rgb`      | `16711680`                     | Current RGB as integer                    |
| `support`  | `get_prop set_power ...`       | Space-separated list of supported methods |

The `support` field is the authoritative source for what commands a device accepts. It should be parsed at discovery time to determine capabilities.

---

## 3. Command Format

### Request

```json
{ "id": 1, "method": "set_bright", "params": [50, "smooth", 500] }
```

- `id` — monotonically increasing integer; used to match responses
- `method` — command name
- `params` — array of parameters

### Response (success)

```json
{ "id": 1, "result": ["ok"] }
```

Or for `get_prop`:

```json
{ "id": 2, "result": ["on", "80", "4000"] }
```

### Response (error)

```json
{ "id": 3, "error": { "code": -1, "message": "unsupported method" } }
```

### Push notifications

The device also sends unsolicited property updates (no `id` field):

```json
{ "method": "props", "params": { "power": "on", "bright": "75" } }
```

These are sent whenever the device state changes (e.g., from physical button or another app).

---

## 4. Device Model Registry

The `model` field in SSDP identifies the logical device type. This is **not** the hardware SKU printed on the box. Mapping between the two is only approximate.

Full list from [python-miio specs.yaml](https://github.com/rytilahti/python-miio):

### Color bulbs (RGB + CT)

| Model                       | CT Range    | Notes                    |
| --------------------------- | ----------- | ------------------------ |
| `color`                     | 1700–6500 K | YLDP02YL (original Gen1) |
| `color1`–`color5`, `color7` | 1700–6500 K | Various gen              |
| `colora`, `colorb`          | 1700–6500 K |                          |
| `colorc`                    | 2700–6500 K |                          |

### White-only bulbs (no RGB)

| Model                              | CT Range    | Notes             |
| ---------------------------------- | ----------- | ----------------- |
| `mono`                             | 2700 K      | Fixed temperature |
| `mono1`, `mono5`, `mono6`, `monob` | 2700 K      |                   |
| `ct_bulb`, `ct2`                   | 2700–6500 K | Adjustable white  |

### LED strips

| Model    | CT Range    | Color |
| -------- | ----------- | ----- |
| `strip1` | 1700–6500 K | ✅    |
| `strip2` | 1700–6500 K | ✅    |
| `strip4` | 2700–6500 K | ✅    |
| `strip6` | 2700–6500 K | ✅    |

### Bedside lamps (bslamp)

| Model     | CT Range    | Color | Night light |
| --------- | ----------- | ----- | ----------- |
| `bslamp1` | 1700–6500 K | ✅    | ❌          |
| `bslamp2` | 1700–6500 K | ✅    | ✅          |
| `bslamp3` | 1700–6500 K | ✅    | ✅          |

> ⚠️ `bslamp2` had LAN control forcibly removed in firmware 2.0.6_0041 by Xiaomi. See [Section 14](#14-lan-control-availability).

### Ceiling lights (CT only, no RGB)

| Model                                              | CT Range    | Night light | Background channel      |
| -------------------------------------------------- | ----------- | ----------- | ----------------------- |
| `ceiling1`–`ceiling6`                              | 2700–6500 K | ✅          | ❌                      |
| `ceiling10`                                        | 2700–6500 K | ✅          | ✅ (1700–6500 K, color) |
| `ceiling13`, `ceiling15`, `ceiling18`, `ceiling24` | 2700–6500 K | ✅          | ❌                      |
| `ceiling19`                                        | 2700–6500 K | ✅          | ✅ (1700–6500 K, color) |
| `ceiling20`                                        | 2700–6500 K | ✅          | ✅ (1700–6500 K, color) |
| `ceiling22`                                        | 2600–6100 K | ✅          | ❌                      |
| `ceila`, `ceil26`                                  | 2700–6500 K | ✅          | ❌                      |

### Desk / table lamps

| Model    | CT Range    | Color | Background channel      |
| -------- | ----------- | ----- | ----------------------- |
| `lamp1`  | 2700–5000 K | ❌    | ❌                      |
| `lamp2`  | 2500–4800 K | ❌    | ❌                      |
| `lamp4`  | 2600–5000 K | ❌    | ❌                      |
| `lamp15` | 2700–6500 K | ❌    | ✅ (1700–6500 K, color) |
| `lamp22` | 2700–6500 K | ✅    | ❌                      |

### Dual-zone devices summary

Devices with a `background` channel (supporting `bg_*` commands):

| Model       | Main channel   | Background channel |
| ----------- | -------------- | ------------------ |
| `lamp15`    | CT 2700–6500 K | RGB 1700–6500 K    |
| `ceiling4`  | CT 2700–6500 K | RGB 1700–6500 K    |
| `ceiling10` | CT 2700–6500 K | RGB 1700–6500 K    |
| `ceiling19` | CT 2700–6500 K | RGB 1700–6500 K    |
| `ceiling20` | CT 2700–6500 K | RGB 1700–6500 K    |

---

## 5. Capability System

Commands a device supports are listed in the `support` SSDP header field (space-separated). This is the only reliable source — the `model` name alone is insufficient.

Example for `lamp15`:

```
get_prop set_default set_power toggle set_ct_abx set_bright start_cf stop_cf
set_scene cron_add cron_get cron_del set_adjust adjust_bright adjust_ct set_name
bg_set_rgb bg_set_hsv bg_set_ct_abx bg_start_cf bg_stop_cf bg_set_scene
bg_set_default bg_set_power bg_set_bright bg_set_adjust bg_adjust_bright
bg_adjust_color bg_adjust_ct bg_toggle dev_toggle
udp_sess_new udp_sess_keep_alive udp_chroma_sess_new set_segment_rgb
```

**Key capability groups:**

| Group      | Methods                               | Indicates                          |
| ---------- | ------------------------------------- | ---------------------------------- |
| Color      | `set_rgb`, `set_hsv`                  | Main channel supports RGB          |
| Color temp | `set_ct_abx`                          | Main channel supports CT           |
| Flow       | `start_cf`, `stop_cf`                 | Main channel supports animations   |
| Background | `bg_set_power`, `bg_set_rgb`...       | Device has a background channel    |
| Music mode | `set_music`                           | TCP music mode supported           |
| Segment    | `set_segment_rgb`                     | Per-side control (lamp15-specific) |
| UDP/Chroma | `udp_sess_new`, `udp_chroma_sess_new` | Razer Chroma integration           |

---

## 6. Channel Architecture

### Single-zone devices

All commands operate on one channel. Main light prefix: no prefix (`set_power`, `set_bright`, etc.)

### Dual-zone devices

Two independent channels:

| Zone       | Prefix | Type                          | Devices                   |
| ---------- | ------ | ----------------------------- | ------------------------- |
| Main       | none   | CT (lamp15) or RGB (ceiling4) | lamp15, ceiling4/10/19/20 |
| Background | `bg_`  | RGB                           | same                      |

**Channel independence:** The two channels have separate power state, brightness, color, and animation state. `dev_toggle` toggles both simultaneously.

**`bg_set_rgb` overrides `set_segment_rgb`:** Calling `bg_set_rgb` paints both sides of the rear strip the same color and resets per-side state.

---

## 7. Commands Reference

### Universal commands (all devices)

| Method        | Parameters                                | Description                            |
| ------------- | ----------------------------------------- | -------------------------------------- |
| `get_prop`    | `"prop1"`, `"prop2"`, ...                 | Read property values                   |
| `set_power`   | `"on"\|"off"`, `"smooth"\|"sudden"`, `ms` | Power on/off                           |
| `toggle`      | —                                         | Toggle power                           |
| `set_bright`  | `1-100`, `"smooth"\|"sudden"`, `ms`       | Brightness                             |
| `set_name`    | `"name"`                                  | Set device name                        |
| `set_default` | —                                         | Save current state as power-on default |
| `cron_add`    | `0`, `minutes`                            | Auto-off timer                         |
| `cron_get`    | `0`                                       | Read timer                             |
| `cron_del`    | `0`                                       | Delete timer                           |

### Color temperature (CT devices)

| Method       | Parameters                           | Range       |
| ------------ | ------------------------------------ | ----------- |
| `set_ct_abx` | `kelvin`, `"smooth"\|"sudden"`, `ms` | 1700–6500 K |

### Color commands (RGB devices)

| Method    | Parameters                                             |
| --------- | ------------------------------------------------------ |
| `set_rgb` | `rgb_int`, `"smooth"\|"sudden"`, `ms`                  |
| `set_hsv` | `hue(0-359)`, `sat(0-100)`, `"smooth"\|"sudden"`, `ms` |

Where `rgb_int = r * 65536 + g * 256 + b`.

### Background channel commands (dual-zone only)

All `bg_*` variants mirror the main channel commands:

| Method           | Parameters                                             |
| ---------------- | ------------------------------------------------------ |
| `bg_set_power`   | `"on"\|"off"`, `"smooth"\|"sudden"`, `ms`              |
| `bg_toggle`      | —                                                      |
| `bg_set_bright`  | `1-100`, `"smooth"\|"sudden"`, `ms`                    |
| `bg_set_rgb`     | `rgb_int`, `"smooth"\|"sudden"`, `ms`                  |
| `bg_set_hsv`     | `hue(0-359)`, `sat(0-100)`, `"smooth"\|"sudden"`, `ms` |
| `bg_set_ct_abx`  | `kelvin`, `"smooth"\|"sudden"`, `ms`                   |
| `bg_start_cf`    | `count`, `action`, `flow_expression`                   |
| `bg_stop_cf`     | —                                                      |
| `bg_set_default` | —                                                      |
| `dev_toggle`     | — (toggles both zones at once)                         |

### set_segment_rgb (lamp15 only, undocumented)

```
set_segment_rgb(left_rgb, right_rgb)
```

Controls left and right halves of the rear strip independently. Not in official spec — determined empirically.

- `left_rgb`, `right_rgb` — integer `r*65536 + g*256 + b`
- Brightness is controlled separately via `bg_set_bright`
- RGB magnitude is **ignored** by the device — only hue/saturation matters
- Calling `bg_set_rgb` afterwards resets to uniform color

### Useful properties for get_prop

| Property        | Description                                   |
| --------------- | --------------------------------------------- |
| `power`         | `"on"` / `"off"` — main channel               |
| `bright`        | Main channel brightness (1–100)               |
| `ct`            | Main channel color temperature (Kelvin)       |
| `rgb`           | Main channel color as rgb_int                 |
| `color_mode`    | `1`=RGB, `2`=CT, `3`=HSV                      |
| `flowing`       | `1` if animation is active                    |
| `bg_power`      | `"on"` / `"off"` — background channel         |
| `bg_bright`     | Background channel brightness (1–100)         |
| `bg_rgb`        | Background channel color as rgb_int           |
| `bg_ct`         | Background channel color temperature (Kelvin) |
| `bg_color_mode` | `1`=RGB, `2`=CT, `3`=HSV                      |
| `bg_flowing`    | `1` if background animation is active         |
| `nl_br`         | Night light brightness                        |
| `active_mode`   | `0`=normal, `1`=night light                   |
| `name`          | Device name                                   |

---

## 8. Flow Animations

Flow (Color Flow) is a sequence of color/brightness transitions played in a loop.

### Command

```
start_cf(count, action, flow_expression)
bg_start_cf(count, action, flow_expression)
```

| Parameter         | Values                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| `count`           | `0` = infinite, `N` = repeat N times                                   |
| `action`          | `0` = restore previous state, `1` = stay on last frame, `2` = turn off |
| `flow_expression` | Comma-separated: `duration_ms, mode, value, brightness` per frame      |

### Frame format

```
duration_ms, mode, value, brightness
```

| Mode | Value   | Meaning            |
| ---- | ------- | ------------------ |
| `1`  | rgb_int | RGB color          |
| `2`  | Kelvin  | Color temperature  |
| `7`  | —       | Sleep (just delay) |

`brightness` = 1–100, or `-1` to keep current brightness.

### Example: Rainbow loop

```json
{
  "method": "bg_start_cf",
  "params": [0, 0, "2000,1,16711680,100,2000,1,65280,100,2000,1,255,100"]
}
```

---

## 9. Music Mode

Music mode **inverts the TCP connection direction**: instead of the app connecting to the lamp, the lamp connects back to the app's TCP server. This removes the ~10 cmd/sec rate limit entirely.

### How it works

1. App opens a TCP listener on a local port
2. App sends `set_music(1, local_ip, port)` to the lamp
3. Lamp connects to the app's listener
4. The original connection is closed
5. All subsequent commands go through the new lamp-initiated connection
6. No rate limiting — commands are accepted as fast as they arrive

### Command

```json
{ "method": "set_music", "params": [1, "192.168.1.100", 54321] }
```

To stop:

```json
{ "method": "set_music", "params": [0] }
```

### Behavior in music mode

- The lamp **does not respond** to `get_prop` queries — it only accepts commands, not queries
- Property state must be tracked locally on the client side
- If the app closes the connection, the lamp returns to normal TCP mode

### Support check

Music mode is gated by the presence of `set_music` in the SSDP `support` field. **`lamp15` does NOT have `set_music` in its support list** — music mode is unavailable on this device.

---

## 10. UDP / Chroma Mode

TCP mode is limited to ~10 commands/sec. For high-frequency reactive effects (e.g., screen ambient sync), the device has a UDP session mode.

| Method                | Description                   |
| --------------------- | ----------------------------- |
| `udp_sess_new`        | Open a UDP session            |
| `udp_sess_keep_alive` | Keepalive to maintain session |
| `udp_chroma_sess_new` | Razer Chroma variant          |

The UDP session protocol is **not documented** — it is used internally by Yeelight's Razer Chroma Connector app. The `lamp15` advertises these methods, confirming it was designed with Razer Chroma integration in mind.

---

## 11. lamp15 (YLTD003) — Deep Dive

### Hardware

- **Product name:** Yeelight Light Bar Pro
- **Hardware SKU:** YLTD003
- **SSDP model ID:** `lamp15`
- **Form factor:** Horizontal light bar, mounts behind monitor

### Physical zones

| #   | Zone                                  | Type            | Commands                                      |
| --- | ------------------------------------- | --------------- | --------------------------------------------- |
| 1   | Front (screen bias)                   | CT only, no RGB | `set_power`, `set_bright`, `set_ct_abx`       |
| 2   | Rear strip — both sides               | RGB             | `bg_set_rgb`, `bg_set_power`, `bg_set_bright` |
| 3   | Rear strip — left/right independently | RGB             | `set_segment_rgb`                             |

### Unique quirk: RGB magnitude normalization

The device normalizes the color vector. Only hue and saturation are preserved — magnitude is discarded.

- `set_segment_rgb(0xFF0000, 0x0000FF)` → bright red left, bright blue right
- `set_segment_rgb(0x010000, 0x000001)` → identical result to above
- `set_segment_rgb(0x800000, 0x000080)` → identical result to above

Brightness is exclusively controlled via `bg_set_bright`.

**Consequence:** It is impossible to have different brightness levels on left vs right sides. Per-side brightness does not exist.

### 0x000000 is undefined

Passing `0x000000` (pure black) as a parameter to `set_segment_rgb` produces undefined behavior — the device may output a faint white or behave unpredictably. Always avoid it.

### Supported methods (complete list)

```
get_prop set_default set_power toggle set_ct_abx set_bright start_cf stop_cf
set_scene cron_add cron_get cron_del set_adjust adjust_bright adjust_ct set_name
bg_set_rgb bg_set_hsv bg_set_ct_abx bg_start_cf bg_stop_cf bg_set_scene
bg_set_default bg_set_power bg_set_bright bg_set_adjust bg_adjust_bright
bg_adjust_color bg_adjust_ct bg_toggle dev_toggle
udp_sess_new udp_sess_keep_alive udp_chroma_sess_new set_segment_rgb
```

Notable absences: **`set_music` is not in this list** — TCP music mode is not available on lamp15.

---

## 12. Known Limitations and Quirks

### Rate limit

TCP mode accepts approximately **10 commands/sec**. Exceeding this causes commands to be silently dropped or the connection to be closed. For reactive/animated effects, either batch commands or use UDP mode (undocumented).

### No per-side brightness on lamp15

`set_segment_rgb` has no brightness parameter, and RGB magnitude is normalized away. Left and right sides always share the same brightness level set by `bg_set_bright`.

### bg_set_rgb resets segment state

Calling `bg_set_rgb` after `set_segment_rgb` sets both sides to a single uniform color. Once `bg_set_rgb` is called, the per-side values are gone.

### Property caching

When using flows or music mode, `get_prop` may not return the currently-rendered color (the device is busy animating). `bg_flow_params` can be read to check what animation is running.

### Color temperature vs RGB

`ct` and `bg_ct` properties contain **Kelvin values** (1700–6500), not RGB integers. Do not confuse them with `rgb` / `bg_rgb`.

### No set_music on lamp15

Music mode (unlimited rate TCP) is not supported on lamp15. The `set_music` method is absent from its support list.

---

## 13. Ecosystem: Other Projects

### Python

| Project                                                             | Stars | Notes                                                                                                                          |
| ------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| [python-yeelight](https://github.com/skorokithakis/python-yeelight) | ~700  | Most complete LAN library. Supports BulbType detection, music mode, flows. Detects WhiteTempMood type via `bg_power` property. |

### TypeScript / JavaScript

| Project                                                                               | Stars | Notes                                                                                            |
| ------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------ |
| [samuraitruong/yeelight](https://github.com/samuraitruong/yeelight)                   | 54    | TS, EventEmitter-based, only tested on YLDP02YL. No capability checking before sending commands. |
| [Artiom-Karimov/yeelight-control](https://github.com/Artiom-Karimov/yeelight-control) | 3     | TS, command pattern, more structured.                                                            |
| [node-red-contrib-yeelight](https://www.npmjs.com/package/node-red-contrib-yeelight)  | —     | Node-RED node, 6 years stale, no bg\_\* commands, no model checks.                               |

### Home Automation

| Project                                                                                                      | Notes                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| [Home Assistant yeelight](https://github.com/home-assistant/core/tree/dev/homeassistant/components/yeelight) | Most maintained implementation. Uses python-yeelight under the hood. Handles BulbType, ambient light as separate entity, push updates. |

### python-yeelight BulbType detection logic

```python
if rgb is None and ct is not None:
    if bg_power is not None:       # <-- dual-zone check
        return BulbType.WhiteTempMood
    return BulbType.WhiteTemp
if all([ct, rgb, hue, sat] are None):
    return BulbType.White
return BulbType.Color
```

`lamp15` is detected as `WhiteTempMood` because its main channel has no RGB (`rgb` = None) but it does have `bg_power` (background channel exists).

---

## 14. LAN Control Availability

LAN control is gated by the Yeelight mobile app toggle. However, **Xiaomi has forced Yeelight to remove LAN control from some devices** after they shipped.

### Known removals

| Device  | Firmware    | Status                                            |
| ------- | ----------- | ------------------------------------------------- |
| bslamp2 | 2.0.6_0041+ | LAN control removed. Toggle disappeared from app. |

Confirmed by Yeelight staff:

> _"lan control feature is from yeelight, xiaomi company takes it as a risk, so we have to disable it."_
> — [forum.yeelight.com, Feb 2021](https://forum.yeelight.com/t/topic/22664/14)

### Implications for development

- Do not assume that a device model that historically had LAN control still has it
- Always check SSDP discovery as the source of truth — if a device doesn't respond to M-SEARCH, LAN is either disabled or removed
- `lamp15` as of current firmware retains full LAN control including the UDP/Chroma session methods
