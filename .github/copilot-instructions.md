# yeelight-client — AI Instructions

## What Is This Project?

A **TypeScript monorepo** for controlling Yeelight smart lights over LAN. It ships:

- **Core library** (`src/`) — published npm package; pure TypeScript, no framework
- **CLI** (`packages/cli/`) — terminal tool built with Ink (React for terminal) + Bun
- **Docs** (`packages/docs/`) — Nextra (Next.js + MDX) documentation site

**Package manager:** pnpm workspaces (pnpm 10+). Runtime: Bun for CLI, Node.js for everything else.

## Two Separate Git Repositories

This workspace contains **two independent git repos**:

| Repo               | Path                                                        | Remote                                     |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------ |
| `yeelight-client`  | `c:\Users\dark\Documents\yeelight-client\`                  | `github.com/NumberOneBot/yeelight-client`  |
| `yeelight-desktop` | `c:\Users\dark\Documents\yeelight-client\packages\desktop\` | `github.com/NumberOneBot/yeelight-desktop` |

- The root `.gitignore` excludes `packages/desktop/` — desktop files are **never** tracked by the outer repo.
- When committing changes inside `packages/desktop/**`, always `cd` into `packages/desktop` and commit there.
- When committing changes outside `packages/desktop/`, commit from the root `yeelight-client` repo.

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

- **No React, no CLI, no side effects** — pure library. Never import from `packages/` here.
- **Throws, never exits** — errors propagate as `Error` instances; `process.exit()` is forbidden.
- **No console output** — callers decide what to print.
- Key types in `types.ts`; named error classes in `errors.ts`.
- `device.ts` is the public API surface. Internal modules (`transport.ts`, `client.ts`) are not re-exported.

### CLI (`packages/cli/`)

- **Every command is an Ink React component** in `commands/*.tsx` — `useEffect` for logic, `exit()` when done, render error `<Text>` on throw.
- **`resolve.ts`** calls `YeelightDevice.discover/connect` and throws on failure — command components only catch and display.
- Never `process.exit()` in command components — use `process.exitCode = 1` + `exit()`.
- Color output via Ink `<Text color="…">` — no raw ANSI strings except `fmt.ts` (`swatch` only).

### Docs (`packages/docs/`)

- Content is MDX in `content/`. Do not generate MDX programmatically.
- `components/Logo.tsx` is an inline SVG — edit directly, do not replace with `<img>`.

## Development Commands

```bash
pnpm dev                                    # library watch mode
pnpm --filter yeelight-cli dev              # CLI (= bun run src/index.tsx)
pnpm --filter yeelight-client-docs dev      # docs dev server
pnpm build                                  # build library (tsup)
pnpm --filter yeelight-cli build:win        # compile CLI binary for Windows
```

## Implementation Philosophy

**Build final, not iterative.** Every feature must be implemented as its final version the first time. No placeholders, no "we'll add this later", no MVP shortcuts that create rework. If a feature is worth doing, it's worth doing properly now.

- Before writing code, think through the complete design: data flow, edge cases, extensibility points.
- If the full scope isn't clear yet, ask — don't guess and build something that will be thrown away.
- "Quick version first" is not a valid approach. Prototypes are only acceptable in throwaway branches.
- Each PR/commit should leave the feature in a state that never needs to be revisited for the same reason.

**No shortcuts that create debt:**

- Never hard-code values that belong in config or constants.
- Never skip error handling at system boundaries.
- Never leave a `// TODO` comment — either do it now or file it as a tracked task.

**No magic numbers in markup — ever:**

- Every spacing, size, or color value in JSX/TSX **must** come from a design token (`--spacing-*`, `--color-*`, etc.) expressed as a Tailwind utility or `var(--token)`.
- If no token exists for the required value, **stop and ask the user** what token to add — do not invent an inline pixel value.
- This applies to `style={{}}` props, `className` arbitrary values (`p-[5px]`), and any hardcoded CSS string.
- Violations: `paddingInline: '5px'`, `style={{ gap: '3px' }}`, `className="p-[7px]"` — all forbidden.

## File Size Limit

- **~300 lines max per file** — split by responsibility when approaching this limit.
- One file = one concern. No god-files or mega-modules.
- Entry points (e.g. `main.ts`, `index.ts`) should only wire up imports — no inline logic.

## Code Style

### General

- **Modern, compact TypeScript** — destructuring, `?.`, `??`, concise ternaries, array methods. Conditional rendering: `data?.support?.length > 0 && ...` — never `data && data.support && data.support.length > 0 && (...)`.
- **Named exports only** — no default exports (Next.js layouts/pages excepted — framework requirement).
- **One source of truth for every constant** — if a value appears in more than one file (strings, colors, numbers), it must live in a single authoritative module and be imported everywhere else. Never duplicate it. In the desktop package: `appName` lives only in `src/lib/config.ts`; CSS `--color-bg` dark value derives from `windowBg` in `electron/config.ts` via the Vite plugin.
- **camelCase everywhere** — constants included; no `SCREAMING_CASE`.
- **No lint warnings** — fix immediately, never suppress with a comment.
- **Boy Scout Rule** — delete dead code (unused imports, variables, props, files) in every file you touch. Scoped to the file being changed.
- **No confabulation** — never state something as fact without verifying it (read a file, run a search). If unsure, say so.

### Architectural Change Protocol

Before proposing or implementing **any change to a UI component** — including styling, hover states, colors, or layout — as well as any change that replaces or moves functionality:

1. **Find all call sites** — use `vscode_listCodeUsages` or `grep_search` on every symbol being changed. Cover the entire monorepo, not just the file being changed.
2. **If the same structure appears in 2+ places** — extract a shared component first, then make the change once. Never fix one instance and move on.
3. **Enumerate dead code** — explicitly list what becomes unreachable after the change. Include methods, IPC handlers, preload bindings, and types.
4. **Plan deletions alongside additions** — the change list must contain both. A proposal that only lists new code is incomplete.

> "Small styling fix" is not an exemption from this protocol. Grep first, always.

### Naming

Names answer _"what is this for?"_, not _"what type/state is this?"_ (Intention-Revealing Names).

Avoid `is`/`has`/`can` prefixes when a shorter name still answers the question: `loading` over `isLoading`, `connected` over `isConnected`. Drop context-redundant modifiers — shorter is always preferred when meaning is preserved.

**Watch for name drift near external data.** Yeelight API field names (`bg_power`, `ct`, `rgb`) must not silently transform across layers. Align internal names to the protocol, not the other way around.

### Component Structure (CLI + Docs only)

Start every new component as a **single file**. Convert to a folder when it grows beyond ~100 lines or needs visual sub-parts:

```
CommandName/
├── index.ts          # barrel: re-exports the component
├── CommandName.tsx   # component
└── components/       # sub-components
```

Sub-components are always preferred over inline render functions. Extract `constants.ts` / `utils.ts` as sibling files when the component grows further.

### Reuse Before Build

Before writing any new UI sub-component, check for an existing one. In the CLI — look at other command components. In the docs — check `packages/docs/components/`.

### DRY: Extract Before Copy

**Never duplicate render logic.** Before writing a second file that would contain the same JSX structure, data shape, or mapping pattern as an existing file — stop and extract a shared component first.

The rule fires at the **second instance**, not the third:

- Adding a new page that renders the same kind of data as an existing page? → shared component first, then both pages use it.
- Same `map()` over a typed array, same conditional heading/text structure, same layout skeleton? → that's a component, not a copy.

A file that only configures a shared component (passes props, imports content) is the correct end state. A file that re-implements the same render logic is always wrong.

This applies even when the existing file is "simple". Complexity is irrelevant — duplication is the violation.

**Check before writing:** look at sibling files in the same folder. If a new file's render would mirror an existing one, extract first.
