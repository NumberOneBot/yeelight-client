# yeelight-control — AI Instructions

## What Is This Project?

A **TypeScript monorepo** for controlling Yeelight smart lights over LAN. It ships:

- **Core library** (`src/`) — published npm package; pure TypeScript, no framework
- **CLI** (`packages/cli/`) — terminal tool built with Ink (React for terminal) + Bun
- **Docs** (`packages/docs/`) — Nextra (Next.js + MDX) documentation site

**Package manager:** pnpm workspaces (pnpm 10+). Runtime: Bun for CLI, Node.js for everything else.

## Monorepo Structure

```
src/                   # Core library — device.ts, channel.ts, transport.ts, discovery.ts, …
packages/
├── cli/               # CLI tool
│   ├── src/
│   │   ├── index.tsx  # Entry point — minimist routing + Ink render()
│   │   ├── resolve.ts # Pure async device resolution (throws, no console output)
│   │   └── commands/  # One .tsx file per command
└── docs/              # Nextra docs
    ├── app/           # Next.js App Router
    ├── components/    # Shared components (Logo, etc.)
    └── content/       # MDX source files
```

## Architecture Rules

### Core Library (`src/`)

- **No React, no CLI, no side effects** — it is a pure library. Never import from `packages/` here.
- **Throws, never exits** — all errors propagate as `Error` instances; `process.exit()` is forbidden.
- **No console output** — callers decide what to print. The library is silent.
- Key types live in `types.ts`; `errors.ts` exports named error classes (`UnsupportedError`, etc.).
- `device.ts` is the public API surface. Internal modules (`transport.ts`, `client.ts`) are not re-exported.

### CLI (`packages/cli/`)

- **Every command is an Ink React component** in `commands/*.tsx`. It runs a side effect in `useEffect`, calls `exit()` when done, and renders an error `<Text>` if something throws.
- **`resolve.ts` is the boundary** between CLI and library: it calls `YeelightDevice.discover/connect` and throws on failure — the command component catches and displays it.
- No `process.exit()` inside command components — use `process.exitCode = 1` + `exit()` instead.
- Color output uses Ink `<Text color="…">` — never raw ANSI strings except in `fmt.ts` (`swatch` only).

### Docs (`packages/docs/`)

- Content is MDX in `content/`. Do not generate MDX programmatically.
- Logo component (`components/Logo.tsx`) is an inline SVG — edit the SVG directly, do not replace with `<img>`.

## Development Commands

```bash
pnpm dev                                    # library watch mode
pnpm --filter yeelight-cli dev              # CLI (= bun run src/index.tsx)
pnpm --filter yeelight-client-docs dev      # docs dev server
pnpm build                                  # build library (tsup)
pnpm --filter yeelight-cli build:win        # compile CLI binary for Windows
```

## Code Style

### General

- **Named exports only** — no default exports anywhere (docs Next.js layouts/pages are an exception; this is a framework requirement).
- **camelCase everywhere** — constants included; no `SCREAMING_CASE`.
- **Lint warnings must not be left in committed code** — fix immediately, never suppress with a comment.
- **Dead code is deleted** — unused imports, variables, props, and files must be removed immediately as part of every task. Never leave anything "just in case".
- **Boy Scout Rule** — leave every file you touch cleaner than you found it. Fix naming, remove dead code — scoped to the file being changed, not the whole codebase.
- **No confabulation** — never state something as fact without verifying it (reading a file, running a search). If unsure, say so and ask.

### Naming

Follow **Intention-Revealing Names** (Clean Code): names should answer _"what is this for?"_, not _"what type/state is this?"_.

Avoid `is`/`has`/`can` prefixes when a more expressive name exists: prefer `loading` over `isLoading`, `connected` over `isConnected` — unless the prefix genuinely adds clarity.

**Keep names compact.** Drop modifiers that add no information given the context. Shorter names that still answer _"what is this for?"_ are always preferred.

**Watch for name drift near external data.** Yeelight API field names (`bg_power`, `ct`, `rgb`) must not silently transform across layers. Align internal names to match the protocol field names, not the other way around.

### Component Structure (CLI + Docs only)

Start every new component as a **single file**. Keep it there as long as it satisfies single responsibility.

**Convert to folder** when the component grows beyond ~100 lines or needs visual sub-parts:
```
CommandName/
├── index.ts          # barrel: re-exports the component
├── CommandName.tsx   # component
└── components/       # sub-components
```

Sub-components are always preferred over inline render functions.

When a component grows further, extract `constants.ts` and/or `utils.ts` as sibling files.

### Reuse Before Build

**Before writing any new UI sub-component**, check for an existing one that does the same job. In the CLI this means looking at other command components first. In the docs, check `packages/docs/components/` before creating new ones.
