# Yeelight Light Bar Pro — LAN API

> Determined empirically. No official documentation exists for this model.

---

## Device

- Model: `lamp15` (YLTD003)
- Protocol: TCP, port `55443`, JSON-RPC over plain-text socket
- Discovery: SSDP UDP multicast `239.255.255.250:1982`
- Command format: `{"id":N,"method":"...","params":[...]}` + `\r\n`
- Enable LAN Control: Yeelight mobile app → device → settings → LAN Control

---

## Physical Zones

The lamp has **three independent channels**:

| #   | Zone                                      | Type             | Commands                                      |
| --- | ----------------------------------------- | ---------------- | --------------------------------------------- |
| 1   | Front light (screen bias lighting)        | CT only (no RGB) | `set_power`, `set_bright`, `set_ct_abx`       |
| 2   | Rear strip — both sides at once           | RGB              | `bg_set_rgb`, `bg_set_power`, `bg_set_bright` |
| 3   | Rear strip — left and right independently | RGB              | `set_segment_rgb`                             |

---

## set_segment_rgb — Independent Side Control

**Real signature** (determined empirically, not in official docs):

```
set_segment_rgb(left_rgb, right_rgb)
```

- First parameter — color of the **left** side
- Second parameter — color of the **right** side
- `rgb_int` = `r * 65536 + g * 256 + b`, e.g. `0xFF0000` = red

**Important: RGB magnitude is ignored.** The device normalizes the color vector — only hue and saturation matter. `rgb(1,0,0)` and `rgb(255,0,0)` produce equally bright red. Actual brightness is controlled exclusively via `bg_set_bright`.

**`bg_set_rgb` overrides `set_segment_rgb`** — calling `bg_set_rgb` paints both sides the same color and resets the per-side values.

**Avoid `0x000000`** as the first or second parameter — behavior is undefined (may produce a dim white).

---

## All Supported Methods (lamp15)

```
get_prop, set_default, set_power, toggle,
set_ct_abx, set_bright, start_cf, stop_cf, set_scene,
cron_add, cron_get, cron_del, set_adjust, adjust_bright, adjust_ct, set_name,
bg_set_rgb, bg_set_hsv, bg_set_ct_abx,
bg_start_cf, bg_stop_cf, bg_set_scene, bg_set_default,
bg_set_power, bg_set_bright, bg_set_adjust,
bg_adjust_bright, bg_adjust_color, bg_adjust_ct,
bg_toggle, dev_toggle,
udp_sess_new, udp_sess_keep_alive, udp_chroma_sess_new,
set_segment_rgb
```

---

## Commands: Rear Strip

### Independent Side Control

| Method            | Parameters              | Description                                                                                                                   |
| ----------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `set_segment_rgb` | `left_rgb`, `right_rgb` | Left and right sides independently. Brightness comes from `bg_bright`. RGB magnitude is ignored — only hue/saturation matter. |

### Global Control (`bg_*`)

| Method           | Parameters                                             | Description                                               |
| ---------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| `bg_set_power`   | `"on"\|"off"`, `"smooth"\|"sudden"`, `ms`              | Turn rear strip on/off                                    |
| `bg_set_rgb`     | `rgb_int`, `"smooth"\|"sudden"`, `ms`                  | Set both sides to one color. Overrides `set_segment_rgb`. |
| `bg_set_hsv`     | `hue(0-359)`, `sat(0-100)`, `"smooth"\|"sudden"`, `ms` | Set color via HSV                                         |
| `bg_set_bright`  | `brightness(1-100)`, `"smooth"\|"sudden"`, `ms`        | Global brightness for both sides (1–100)                  |
| `bg_set_ct_abx`  | `ct(1700-6500)`, `"smooth"\|"sudden"`, `ms`            | Color temperature in Kelvin                               |
| `bg_toggle`      | —                                                      | Toggle on/off                                             |
| `bg_set_default` | —                                                      | Save current state as power-on default                    |

### Animation (`bg_start_cf`)

```
bg_start_cf(count, action, flow_expression)
```

- `count` — number of repetitions; `0` = infinite
- `action` — behavior on stop: `0` = restore previous state, `1` = stay on last frame, `2` = turn off
- `flow_expression` — comma-separated frames: `duration_ms, mode, value, brightness, ...`
  - `mode=1` — RGB (`value` = rgb_int)
  - `mode=2` — CT (`value` = Kelvin)

Rainbow example:

```
bg_start_cf(0, 0, "2000,1,16711680,100,2000,1,65280,100,2000,1,255,100")
```

| Method        | Description     |
| ------------- | --------------- |
| `bg_start_cf` | Start animation |
| `bg_stop_cf`  | Stop animation  |

---

## Commands: Front Light (CT only, no RGB)

| Method                 | Parameters                                      | Description               |
| ---------------------- | ----------------------------------------------- | ------------------------- |
| `set_power`            | `"on"\|"off"`, `"smooth"\|"sudden"`, `ms`       | Turn on/off               |
| `set_bright`           | `brightness(1-100)`, `"smooth"\|"sudden"`, `ms` | Brightness                |
| `set_ct_abx`           | `ct(1700-6500)`, `"smooth"\|"sudden"`, `ms`     | Color temperature         |
| `start_cf` / `stop_cf` | same as `bg_start_cf`                           | Animation for front light |

---

## Utilities

| Method       | Parameters                | Description                      |
| ------------ | ------------------------- | -------------------------------- |
| `get_prop`   | `"prop1"`, `"prop2"`, ... | Read current property values     |
| `set_name`   | `"name"`                  | Rename the device                |
| `dev_toggle` | —                         | Toggle both zones simultaneously |
| `cron_add`   | `0`, `minutes`            | Auto-off timer                   |
| `cron_get`   | `0`                       | Read timer                       |
| `cron_del`   | `0`                       | Delete timer                     |

### Useful properties for `get_prop`

| Property         | Description                                     |
| ---------------- | ----------------------------------------------- |
| `bg_power`       | `"on"` / `"off"`                                |
| `bg_bright`      | Rear strip brightness (1–100)                   |
| `bg_rgb`         | Current color as rgb_int                        |
| `bg_ct`          | Rear strip color temperature (Kelvin, not RGB)  |
| `bg_color_mode`  | `1`=RGB, `2`=CT, `3`=HSV                        |
| `bg_flowing`     | `1` if animation is running                     |
| `bg_flow_params` | Parameters of the last animation                |
| `power`          | Front light on/off state                        |
| `bright`         | Front light brightness                          |
| `ct`             | Front light color temperature (Kelvin, not RGB) |

> **Note:** `ct` and `bg_ct` are Kelvin values (1700–6500). Do not treat them as RGB integers.

---

## UDP Mode (Razer Chroma / high-frequency updates)

TCP mode is limited to ~10 commands/sec. For high-frequency updates the device supports UDP sessions:

| Method                | Description                                 |
| --------------------- | ------------------------------------------- |
| `udp_sess_new`        | Open a UDP session                          |
| `udp_sess_keep_alive` | Keep the session alive                      |
| `udp_chroma_sess_new` | Chroma mode session (used by Razer Synapse) |

The UDP session protocol is not publicly documented. This is what Yeelight Chroma Connector uses internally for reactive lighting.

---

## Known Limitations

### Per-side brightness — not possible

`bg_set_bright` is global for the entire rear strip. `set_segment_rgb` has no brightness parameter. Since the device normalizes the RGB magnitude away, passing a dimmer value like `rgb(64,0,0)` instead of `rgb(255,0,0)` has **no effect** — both produce the same brightness. Both sides always share the same brightness level.

### TCP throughput

Approximately **10 commands/sec** over TCP. For faster reactive updates, the UDP session mode is required (protocol undocumented).

---

## Client API (src/client.ts)

```typescript
client.setSegments(leftR, leftG, leftB, rightR, rightG, rightB)  // independent sides
client.setAll(r, g, b, effect?, duration?)                        // both sides same color
client.setPower(on, effect?, duration?)                           // rear strip on/off
client.setBrightness(brightness, effect?, duration?)              // 1–100, both sides
client.send(method, params)                                       // raw RPC
```
