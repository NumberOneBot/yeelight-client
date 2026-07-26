# yeelight-cli

## 1.4.0

### Minor Changes

- Add `--sort <model|ip>` to interactive mode — order the device list by model (default) or IP (octet-aware, so `192.168.1.9` sorts before `192.168.1.10`; equal models fall back to IP for a stable order).

  Interactive fixes:

  - Lock the menu while a power toggle is in flight (`toggle()` plus a `getState()` round trip), so the cursor can no longer move or open a subscreen mid-switch; the focused row renders muted while input is ignored.
  - Quit now works on non-Latin keyboard layouts — the physical `q` key on ЙЦУКЕН, Serbian/Macedonian Cyrillic and Arabic/Persian, not just Latin `q`.

  Precompiled **Linux (x64)** binaries are now published to Releases, alongside the existing Windows and macOS builds.

  Also: cleaner `npm publish` (bin path + repository metadata), and a macOS demo-recording guide with an interactive demo GIF embedded in the README and docs.

## 1.3.7

### Patch Changes

- Update dependencies to current versions and align the library and CLI to a shared version.

  - CLI: react 19.2.7, ink 7.1.0, react-devtools-core 7, @types/react 19.2.17
  - Library: @types/node 26, prettier 3.9.5, tsx 4.23.0, @types/bun 1.3.14
  - Docs (internal): upgraded to Next 16; pinned zod to 4.3.6 to keep Nextra 4.6.1 rendering working

## 1.3.6 (2026-04-24)

### Patch Changes

- Migrate to ink 7 and React 19
- Remove unused `react-devtools-core` dev dependency

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
