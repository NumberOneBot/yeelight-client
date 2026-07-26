# Skeleton for the interactive-mode demo — see README.md in this folder.
# Replace the body below with the trimmed output of `vhs record`.
# Render with:  vhs demo/interactive.tape   (run from packages/cli)

Output ../assets/demo.gif

Set Shell powershell
Set FontSize 16
Set Width 1200
Set Height 700
Set Padding 20
Set TypingSpeed 90ms

# Setup stays out of frame: put the compiled binary on PATH so the prompt
# shows a bare `ylc`, the way an installed CLI would be invoked.
Hide
Type `$env:Path = (Resolve-Path ./dist).Path + ';' + $env:Path`
Enter
Type "Clear-Host"
Enter
Show

Type "ylc interactive"
Enter
Sleep 4s

# --- body: replace with the recorded flow ---
Sleep 2s
# ------------------------------------------

Type "q"
Sleep 1s
