# macOS demo tape — authentic SSDP discovery (no --scan tcp needed on a real LAN).
# Render from packages/cli:  vhs demo/interactive.mac.tape
# Requires: vhs, ttyd, ffmpeg on PATH; dist/ylc built (pnpm --filter yeelight-cli build:mac-arm64).
# First run: grant Terminal "Local Network" permission so SSDP discovery works.

Output ./demo.gif
Set Shell zsh
Set FontFamily "Cascadia Code"
Set FontSize 16
Set Width 940
Set Height 500
Set Padding 18
Set TypingSpeed 80ms

# setup out of frame: put the compiled ylc on PATH, clear the screen
Hide
Type "export PATH=$PWD/dist:$PATH"
Enter
Type "clear"
Enter
Show
Sleep 200ms

# discover — native SSDP is fast (~3s), so this stays snappy (no scan trim needed)
Type "ylc interactive"
Sleep 400ms
Enter
Sleep 5s

# browse the device list
Down@400ms 4
Sleep 600ms
Up@400ms 4
Sleep 600ms

# connect to the first (color) lamp
Enter
Sleep 2000ms

# turn on the lamp
Enter
Sleep 1200ms

# browse the control menu
Down
Sleep 600ms
Enter
Sleep 2000ms

# brightness

Up@400ms 5
Sleep 600ms
Enter
Sleep 600ms
Down@400ms 6
Enter
Sleep 1200ms

# color temp

Down
Sleep 600ms
Enter
Sleep 1200ms
Up@400ms 8
Sleep 600ms
Enter
Sleep 1200ms
Left
Sleep 1200ms

# show rgb color menu
Down
Sleep 600ms
Enter
Sleep 2000ms

# back to the device list, then quit
Left
Sleep 1200ms
Type "q"
Sleep 800ms
