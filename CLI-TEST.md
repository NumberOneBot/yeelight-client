# CLI Testing Checklist

> Binary: `ylc` (dev: `pnpm --filter yeelight-cli dev`)
> Run all commands from the repo root unless stated otherwise.
> Replace `192.168.x.x` with the real device IP from `discover`.

---

## 0. Setup

- [ ] `pnpm --filter yeelight-cli build:win` — builds without errors
- [ ] `./packages/cli/dist/ylc.exe --version` — prints `0.1.0`
- [ ] `./packages/cli/dist/ylc.exe --help` — shows help screen with all commands

---

## 1. interactive

### 1.1 Launch

```
ylc interactive
```

- [ ] Shows `Scanning...` with animated dots
- [ ] Lists discovered devices (IP, model, bg/seg tags)
- [ ] ↑↓ moves cursor, Enter selects device
- [ ] Shows `Connecting...` with animated dots
- [ ] Shows action menu with device IP and model
- [ ] Action menu shows relevant actions (ct/color filtered by capabilities)
- [ ] Enter executes selected action, shows `✓ Done` briefly
- [ ] `q` quits from any screen

### 1.2 Alias

```
ylc i
```

- [ ] Same as `ylc interactive`

### 1.3 Back navigation

- [ ] `↩ back to devices` re-runs discovery and shows device list again

---

## 2. discover

### 1.1 Auto-discover

```
ylc discover
```

- [x] Finds at least one device
- [x] Shows IP, device name, model in parentheses
- [x] Shows `background` tag if device has BG channel
- [x] Shows `segments` tag if device has segments

### 1.2 Custom timeout

```
ylc discover --timeout 5000
```

- [x] Runs ~5 seconds, then exits

### 1.3 Short timeout (no devices expected)

```
ylc discover --timeout 100
```

- [x] Exits quickly with "No devices found" message (not a crash)

---

## 2. status

### 2.1 Auto-discover

```
ylc status
```

- [ ] Shows main channel: power, brightness, color temp or rgb
- [ ] Exits cleanly

### 2.2 By IP

```
ylc status --ip 192.168.x.x
```

- [ ] Same output without discovery delay

### 2.3 Device with background channel

```
ylc status --ip 192.168.x.x
```

- [ ] Shows both `Main` and `Background` sections

### 2.4 Wrong IP

```
ylc status --ip 1.2.3.4
```

- [ ] Prints red error message
- [ ] Exits with non-zero code (`echo $?` / `echo %ERRORLEVEL%`)

---

## 3. power

### 3.1 Turn on

```
ylc power on
```

- [ ] Light turns on
- [ ] Exits cleanly

### 3.2 Turn off

```
ylc power off
```

- [ ] Light turns off
- [ ] Exits cleanly

### 3.3 By IP

```
ylc power on --ip 192.168.x.x
```

- [ ] Works without discovery

### 3.4 Background channel

```
ylc power on --bg
ylc power off --bg
```

- [ ] Toggles only background channel

### 3.5 Invalid argument

```
ylc power yes
```

- [ ] Prints `Usage: ylc power <on|off>` and exits with error

---

## 4. brightness

### 4.1 Set brightness

```
ylc brightness 50
```

- [ ] Light changes to 50%

### 4.2 Min/max values

```
ylc brightness 1
ylc brightness 100
```

- [ ] Both work without error

### 4.3 With transition

```
ylc brightness 10 --duration 2000
```

- [ ] Smooth 2-second transition visible

### 4.4 Short alias

```
ylc br 75
```

- [ ] Works identically to `brightness`

### 4.5 Background channel

```
ylc brightness 30 --bg
```

- [ ] Changes only background brightness

### 4.6 Invalid argument

```
ylc brightness abc
```

- [ ] Prints `Usage: ylc brightness <1-100>` and exits with error

---

## 5. ct (color temperature)

### 5.1 Warm white

```
ylc ct 2700
```

- [ ] Light goes warm yellow-white

### 5.2 Cool white

```
ylc ct 6500
```

- [ ] Light goes cool blue-white

### 5.3 Boundary values

```
ylc ct 1700
ylc ct 6500
```

- [ ] Both accepted without error

### 5.4 With transition

```
ylc ct 4000 --duration 3000
```

- [ ] Smooth 3-second shift visible

### 5.5 Background channel

```
ylc ct 3000 --bg
```

- [ ] Changes only background channel

### 5.6 Invalid argument

```
ylc ct hello
```

- [ ] Prints `Usage: ylc ct <kelvin>` and exits with error

---

## 6. color

### 6.1 Hex 6-digit

```
ylc color "#ff6400"
```

- [ ] Light turns orange

### 6.2 Hex 3-digit shorthand

```
ylc color "#f00"
```

- [ ] Light turns red

### 6.3 Hex with alpha → brightness

```
ylc color "#ff000080"
```

- [ ] Red + brightness ~50% (`0x80 / 255 * 100 ≈ 50`)

### 6.4 RGB values

```
ylc color 0 255 0
```

- [ ] Light turns green

### 6.5 With transition

```
ylc color "#0000ff" --duration 2000
```

- [ ] Smooth fade to blue

### 6.6 Background channel

```
ylc color "#ff0000" --bg
```

- [ ] Changes only background

### 6.7 Invalid hex

```
ylc color "#zzzzzz"
```

- [ ] Prints error about invalid hex, exits with error

### 6.8 Invalid RGB

```
ylc color 300 0 0
```

- [ ] Prints error about 0-255 range, exits with error

---

## 7. segment (lamp15 / YLTD003 only)

### 7.1 Two different colors

```
ylc segment "#ff0000" "#0000ff"
```

- [ ] Left side red, right side blue

### 7.2 Short hex

```
ylc segment "#f00" "#0f0"
```

- [ ] Left red, right green

### 7.3 By IP

```
ylc segment "#ffffff" "#000000" --ip 192.168.x.x
```

- [ ] Left white, right off

### 7.4 Missing argument

```
ylc segment "#ff0000"
```

- [ ] Prints usage error, exits with error

### 7.5 Invalid color format

```
ylc segment "red" "#0000ff"
```

- [ ] Prints `Invalid left color: red`, exits with error

---

## 8. Error handling

- [ ] `ylc unknowncommand` — shows help screen (no crash)
- [ ] `ylc` (no args) — shows help screen
- [ ] `ylc -h` — shows help screen
- [ ] `ylc --help` — shows help screen
- [ ] `ylc -V` — prints version
- [ ] `ylc --version` — prints version
