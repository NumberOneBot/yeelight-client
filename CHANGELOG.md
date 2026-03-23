# Changelog

## 1.1.2 (2026-03-24)

### Fixed

- CLI (`yeelight-cli`): remove duplicate `#!/usr/bin/env bun` shebang from source entry — tsup banner already adds `#!/usr/bin/env node`, causing a syntax error on install

## 1.1.0 (2026-03-24)

### Added

- `setScene(SceneConfig)` — atomically turn on and apply state (color, CT, HSV, flow, or auto_delay_off); works on both main and background channels
- `setName(name)` — persist device name to device memory
- `devToggle()` — toggle main + background channels simultaneously (dual-zone devices)
- `cronAdd(minutes)` / `cronDel()` / `cronGet()` — sleep timer with read-back
- `setAdjust(action, prop)` / `adjustBrightness(pct)` / `adjustColorTemp(pct)` / `adjustColor()` — relative adjustments without knowing the current value
- `setPower()` now accepts `PowerOptions` with optional `mode: PowerMode` (0–5)
- New types exported: `SceneConfig`, `PowerMode`, `PowerOptions`, `CronTimer`

### CLI

- New commands: `toggle`, `name`, `timer set/cancel/status`, `adjust brightness/ct/color`
- Interactive mode: exit immediately on connection error instead of hanging
- Help column width increased to prevent argument wrapping

### Fixed

- Direct `--ip` connections now assume full capabilities — all commands sent directly to device without pre-flight capability check
- `setSegments()` guard removed — device error is returned directly if not supported

## 1.0.1 (2026-03-23)

### Fixed

- Add npm link to CLI section in core README
- Remove downloads badges from both READMEs
- Fix lockfile for CI (`--frozen-lockfile`)
- Remove internal docs (ARCHITECTURE.md, CLI-TEST.md, COMMANDS.md)

## 1.0.0 (2026-03-23)

First stable release. Both `yeelight-client` and `yeelight-cli` published to npm.

### Added

- CLI README with full command reference, options, and examples
- Cross-links between `yeelight-client` and `yeelight-cli` npm pages
- CLI npm metadata: description, author, repository, homepage, bugs, keywords

### Changed

- Move `@types/minimist` and `@types/react` to devDependencies in CLI

## 0.9.8 (2026-03-23)

### Added

- Package metadata for npm: `description`, `author`, `repository`, `homepage`, `bugs`, `keywords`, `engines`

### Changed

- Changeset access set to `public` for npm publish

### Internal (CLI)

- Extract `parseHex` utility, `useAsyncAction` hook, `DeviceHeader` component
- Extract `useCommand` hook for one-shot CLI commands
- Extract `useDeviceState` hook from `DeviceMenu`
- Rename `PropRow` → `StatRow` in `ChannelStatus` to avoid collision
- Clarify `resolve.ts` SSDP preference with inline comment

## 0.9.0 (2026-03-17)

### Added

- Interactive segment color control for lamp15 devices
- Keepalive ping + disconnect detection in interactive mode
- Disable ct/rgb/brightness controls when channel power is off

### Fixed

- Reflect bg power-on after segment apply in interactive UI state
- Increase interactive transition duration to 500ms
- Sync status and interactive UI; read version from package.json

### Internal (CLI)

- Split `DeviceMenu` and `PropertyMenu` into atomic components
- Color picker improvements and channel state fixes

## 0.8.0 (2026-03-12)

### Added

- Initial interactive mode (TUI) with device picker, device menu, property editing
- Color mode row in status output for dual-mode channels
- Channel capabilities shown in `discover` output

### Changed

- Flatten `Capabilities` — remove `DeviceCapabilities` wrapper
- Extract `ChannelStatus` component and color utilities

### Fixed

- Color mode parsing in `channel.ts`; align labels across CLI
- Remove segments row from channel status output

## 0.7.0 (2026-03-08)

### Added

- Rich status output with parallel SSDP + TCP resolution
- Per-command help system; discover UX improvements
- `ErrorText` component for styled error messages

### Changed

- Refactor CLI entry point; extract `help.tsx`

## 0.6.0 (2026-03-05)

### Added

- Node.js build via tsup for npm publish
- Animated connecting/scanning dots in CLI

### Changed

- Remove dead `client.ts`, `RpcCommand`; clean up `fmt.ts`
- Remove `.js` extensions from local CLI imports

## 0.5.0 (2026-03-02)

### Added

- CLI app icon (SVG/ICO) with automated build pipeline
- Protocol documentation (MDX) with commands reference and known limitations

### Changed

- Rename CLI command from `yeelight` to `ylc`
- Rename package to `yeelight-client`

## 0.4.0 (2026-02-27)

### Added

- GitHub Pages deploy workflow for docs
- MIT license

### Fixed

- Move CLI binaries to `packages/cli/dist`
- Add `react-devtools-core` dev dependency for Ink

## 0.3.0 (2026-02-24)

### Added

- Nextra docs site with architecture, protocol, commands pages
- pnpm monorepo structure with workspaces

### Changed

- Restructure project to pnpm monorepo; migrate CLI to Ink (React for terminal)

## 0.2.2 (2026-02-22)

### Added

- CI release workflow for CLI binaries

## 0.2.1 (2026-02-21)

### Added

- GitHub Releases support

## 0.1.0 (2026-02-20)

- Initial release — device discovery, connection, light control, color flow API
