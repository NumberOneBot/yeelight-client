# Demo recording

How the interactive-mode GIF in the README and docs is produced.

The tape lives here (`interactive.mac.tape`); rendering it with VHS produces the
GIF. The published GIF is referenced as `../assets/demo.gif`.

Generate the demo on a **Mac that is on the same LAN as the lamps** — discovery is
live over SSDP, so `ylc interactive` finds the lamps in a few seconds, exactly what
a real user sees.

## Toolchain

VHS does not capture your terminal. It starts `ttyd` (a terminal exposed as a web
page), drives it in a headless Chromium, screenshots frames and pipes them through
`ffmpeg`. Install the three tools; VHS downloads its own Chromium on first run.

| Tool   | Version | Why                                 |
| ------ | ------- | ----------------------------------- |
| vhs    | 0.11.0  | Runs the tape, drives the recording |
| ttyd   | 1.7.7   | Hosts the shell as a web terminal   |
| ffmpeg | recent  | Encodes frames into the GIF         |

```zsh
brew install vhs ttyd ffmpeg
```

On the first render, VHS (via go-rod) downloads a matching Chromium into
`~/Library/Caches/rod` — no system Chrome required.

### macOS gotcha: Local Network permission

`ylc interactive` discovers lamps over SSDP multicast, and macOS (Sonoma/Sequoia)
gates LAN access behind a **Local Network** permission. The system prompt only
appears for an interactive app, but VHS runs the shell headless — so if the host
terminal has not been granted access, discovery silently returns nothing.

Grant it once before rendering: run `./dist/ylc interactive` in Terminal, approve
the "find devices on your local network" prompt, and confirm the lamps appear. VHS
renders then inherit that grant. (It also shows up under System Settings → Privacy
& Security → Local Network.)

## Record against the compiled binary

The tape shows the command line, so it must run the real `ylc`, never
`bun run src/index.tsx` — that is noise, and wrong for someone who installed the
published CLI.

```zsh
pnpm --filter yeelight-cli build:mac-arm64   # produces dist/ylc  (Intel: build:mac-x64)
```

The tape puts `dist` on PATH inside a hidden setup block, so the prompt reads a
bare `ylc`, matching what a user with the package installed would type.

## Workflow

1. **Author the tape.** Start from `interactive.mac.tape` and shape the flow, keys
   and timings by hand. (`vhs record` can capture a live session, but it is finicky
   and does not always emit a usable tape; hand-authoring against the known key map
   is more reliable.)
2. **Render.** From `packages/cli`:
   ```zsh
   vhs demo/interactive.mac.tape
   ```
   The `Output` line in the tape sets the destination; point it at
   `../assets/demo.gif` for the published GIF.
3. **Review the GIF, not the tape.** Timings that read fine as numbers are often
   too fast on screen — the device list and each menu need a beat before the next
   keypress.

Key map for the tape: `↑↓` navigate · `Enter` select · `←` back · `q` quit.

## Tape conventions

- `Set Shell zsh` — the recording host is macOS.
- The hidden setup block prepends `dist` to PATH so the command reads
  `ylc interactive`.
- Keep `Set Width`/`Set Height` at a size where the widest device row fits without
  wrapping; the picker prints IP, model and capabilities on one line.
- `Hide`/`Show` around setup keeps the PATH export and `clear` out of the frame.
- Discovery is live — there is no fixture mode. Anything on screen (IPs, device
  names) ends up in the published GIF.
