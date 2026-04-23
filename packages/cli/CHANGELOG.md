# yeelight-cli

## 1.3.5 (2026-04-09)

### Patch Changes

- Move `yeelight-client` from `dependencies` to `devDependencies` — library is bundled into the CLI binary and does not need to be installed by consumers
- Add `prepublishOnly` script to guarantee the build runs before every `npm publish`

## 1.3.4 (2026-04-09)

### Patch Changes

- Sort discovered devices by model name in `discover` output and device picker
- Fix color label — display "Color temp" instead of "CT" in device capability list
- Reorder `ct+rgb` labels: Color temp shown first, RGB second
- Use `greenBright` for Segments indicator
- Update `adjust` help text: "color temp" instead of "CT"

## 1.3.3

### Patch Changes

- Fix TypeError: device.main.getState is not a function on brightness-only devices

## 1.3.2

### Patch Changes

- Publish via pnpm to resolve workspace:\* dependency

## 1.3.1

### Patch Changes

- Fix workspace:\* dependency not resolved on npm install
