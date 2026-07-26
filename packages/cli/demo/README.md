# Demo recording

How the interactive-mode GIF in the README and docs is produced.

Tapes live here; the rendered GIF goes to `../assets/demo.gif`.

## Toolchain

VHS does not capture your terminal. It starts `ttyd` (a terminal exposed as a
web page), opens that page in headless Chrome, screenshots frames and pipes
them through `ffmpeg`. All four pieces have to be present:

| Tool   | Version used | Why                                 |
| ------ | ------------ | ----------------------------------- |
| vhs    | 0.11.0       | Runs the tape, drives the recording |
| ttyd   | 1.7.7        | Hosts the shell as a web terminal   |
| ffmpeg | 8.1.2        | Encodes frames into GIF/MP4         |
| Chrome | any recent   | Headless renderer VHS screenshots   |

Install on Windows:

```powershell
winget install -e --id charmbracelet.vhs
winget install -e --id tsl0922.ttyd
winget install -e --id Gyan.FFmpeg
```

They land in `%LOCALAPPDATA%\Microsoft\WinGet\Links`, which is already on PATH —
open a new shell after installing.

### Windows gotcha: Chrome and RUNASADMIN

VHS launches Chrome with a plain `CreateProcess`. If Chrome carries the
"Run this program as an administrator" compatibility flag, that call fails with
`ERROR_ELEVATION_REQUIRED` and VHS reports only `could not launch browser`.

Check for the flag:

```powershell
Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers'
```

If the entry for `chrome.exe` contains `RUNASADMIN`, remove it from an elevated
shell:

```powershell
Remove-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers' `
  -Name 'C:\Program Files\Google\Chrome\Application\chrome.exe'
```

Deleting the value is not enough on its own — Windows caches the compatibility
decision per executable until the next boot, so `CreateProcess` keeps failing
with the same error. Reboot, then confirm the fix without launching VHS:

```powershell
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$psi.Arguments = '--headless=new --dump-dom about:blank'
$psi.UseShellExecute = $false
[System.Diagnostics.Process]::Start($psi).WaitForExit()
```

## Record against the compiled binary

Recordings must run `ylc.exe`, never the dev script — the tape shows the command
line, and `bun run src/index.tsx` in the frame is both noise and wrong for
someone who installed the published CLI.

```powershell
pnpm --filter yeelight-cli build:win   # produces dist/ylc.exe
```

Put `dist` on PATH inside the tape (see `Env` below) so the prompt shows a bare
`ylc`, matching what a user with the package installed would type.

## Workflow

1. **Record a draft.** `vhs record --shell powershell > demo/draft.tape`
   captures real keystrokes and timings into a tape file. This step needs no
   browser — only rendering does — so drafts can be recorded before the Chrome
   issue above is sorted out. End the session with `exit`.
2. **Edit the tape.** The raw capture is unusable as-is: it carries every typo,
   real-world pauses and shell noise. Trim it to the intended flow, replace
   organic delays with explicit `Sleep`, and drop anything that leaks local
   details (paths, IPs, hostnames).
3. **Render.** `vhs demo/interactive.tape` writes `assets/demo.gif`.
4. **Review the GIF, not the tape.** Timings that read fine as numbers are
   often too fast to follow on screen — the device list and each menu need a
   beat before the next keypress.

## Tape conventions

- `Set Shell powershell` — the recording host is Windows.
- `Env PATH` prepends `dist` so the command reads `ylc interactive`.
- Keep `Set Width`/`Set Height` at a size where the widest device row fits
  without wrapping; the picker prints IP, model and capabilities on one line.
- `Hide`/`Show` around setup commands keeps `cd`, PATH juggling and the build
  out of the frame.
- The lamps have to be reachable on the LAN while recording — discovery is
  live, there is no fixture mode. Anything on screen (IPs, device names) ends
  up in the published GIF.
