# macOS demo tape — authentic SSDP discovery (no --scan tcp needed on a real LAN).
# Render from packages/cli:  vhs demo/interactive.mac.tape
# Requires: vhs, ttyd, ffmpeg on PATH; dist/ylc built (pnpm --filter yeelight-cli build:mac-arm64).
# First run: grant Terminal "Local Network" permission so SSDP discovery works.

Output ../assets/demo.gif
Set Shell zsh
Set FontSize 16
Set Width 1100
Set Height 440
Set Padding 24
Set TypingSpeed 80ms

# setup out of frame: put the compiled ylc on PATH, clear the screen
Hide
Type "export PATH=$PWD/dist:$PATH"
Enter
Type "clear"
Enter
Show
Sleep 600ms

# discover — native SSDP is fast (~3s), so this stays snappy (no scan trim needed)
Type "ylc interactive"
Sleep 400ms
Enter
Sleep 4s
Sleep 1200ms

# browse the device list
Down@700ms 2
Sleep 900ms
Up@700ms 2
Sleep 900ms

# connect to the first (color) lamp
Enter
Sleep 2500ms
Sleep 1000ms

# browse the control menu
Down@700ms 3
Sleep 1s
Up@700ms 3
Sleep 900ms

# back to the device list, then quit
Left
Sleep 1200ms
Type "q"
Sleep 800ms
