import React from 'react'
import { Box, Text, useApp } from 'ink'

function Cmd({
  name,
  args,
  desc
}: {
  name: string
  args?: string
  desc: string
}) {
  return (
    <Box gap={1}>
      <Box width={12}>
        <Text color="cyan" bold>
          {name}
        </Text>
      </Box>
      <Box width={22}>
        <Text color="yellow">{args ?? ''}</Text>
      </Box>
      <Text dimColor>{desc}</Text>
    </Box>
  )
}

function Opt({ flag, desc }: { flag: string; desc: string }) {
  return (
    <Box gap={1}>
      <Box width={22}>
        <Text color="cyan">{flag}</Text>
      </Box>
      <Text dimColor>{desc}</Text>
    </Box>
  )
}

function UsageLine({ cmd, args }: { cmd: string; args?: string }) {
  return (
    <Box gap={1} marginBottom={1}>
      <Text bold>Usage:</Text>
      <Text color="magenta" bold>
        ylc
      </Text>
      <Text color="cyan" bold>
        {cmd}
      </Text>
      {args && <Text color="yellow">{args}</Text>}
      <Text dimColor>[options]</Text>
    </Box>
  )
}

function StdOpts() {
  return (
    <Box marginLeft={2} marginTop={1} flexDirection="column">
      <Opt flag="--bg" desc="Target background channel" />
      <Opt flag="--ip <address>" desc="Device IP (auto-discover if omitted)" />
      <Opt flag="--duration <ms>" desc="Transition duration in ms" />
    </Box>
  )
}

export function HelpScreen() {
  const { exit } = useApp()
  React.useEffect(() => {
    exit()
  }, [])

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box gap={1} marginBottom={1}>
        <Text bold>Usage:</Text>
        <Text color="magenta" bold>
          ylc
        </Text>
        <Text color="yellow">{'<command>'}</Text>
        <Text dimColor>[options]</Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text bold>Commands:</Text>
        <Box marginLeft={2} marginTop={1} flexDirection="column">
          <Cmd name="discover" desc="Discover devices on the network (UDP)" />
          <Cmd
            name="scan"
            desc="Scan subnet via TCP (finds devices without LAN Control SSDP)"
          />
          <Cmd name="status" desc="Show current device state" />
          <Cmd name="interactive" desc="Interactive device control (TUI)" />
          <Cmd name="power" args="<on|off>" desc="Turn on or off" />
          <Cmd name="brightness" args="<1–100>" desc="Set brightness" />
          <Cmd
            name="ct"
            args="<kelvin>"
            desc="Set color temperature (1700–6500)"
          />
          <Cmd name="color" args="<#hex | r g b>" desc="Set RGB color" />
          <Cmd
            name="segment"
            args="<left> <right>"
            desc="Left/right segment colors (lamp15)"
          />
          <Cmd name="toggle" desc="Toggle main + background simultaneously" />
          <Cmd name="name" args="<name>" desc="Set device name" />
          <Cmd
            name="timer"
            args="<set|cancel|status>"
            desc="Sleep timer (auto power-off)"
          />
          <Cmd
            name="adjust"
            args="<brightness|ct|color>"
            desc="Relative brightness / CT / color adjust"
          />
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text bold>Options:</Text>
        <Box marginLeft={2} marginTop={1} flexDirection="column">
          <Opt flag="--bg" desc="Target background channel" />
          <Opt
            flag="--ip <address>"
            desc="Device IP (auto-discover if omitted)"
          />
          <Opt
            flag="--duration <ms>"
            desc="Transition duration in ms (default: 0)"
          />
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Run </Text>
        <Text color="cyan">ylc {'<command>'} --help</Text>
        <Text dimColor> for command-specific options.</Text>
      </Box>
    </Box>
  )
}

export function CommandHelpScreen({ cmd }: { cmd: string }) {
  const { exit } = useApp()
  React.useEffect(() => {
    exit()
  }, [])

  const screens: Record<string, React.ReactNode> = {
    discover: (
      <>
        <UsageLine cmd="discover" />
        <Text bold>Options:</Text>
        <Box marginLeft={2} marginTop={1} flexDirection="column">
          <Opt
            flag="--timeout <ms>"
            desc="Discovery timeout in ms (default: 3000)"
          />
        </Box>
      </>
    ),
    scan: (
      <>
        <UsageLine cmd="scan" />
        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>
            Scans all /24 subnet hosts via TCP port 55443. Finds devices that
            don't respond to SSDP multicast.
          </Text>
        </Box>
      </>
    ),
    interactive: (
      <>
        <UsageLine cmd="interactive" />
        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>
            Discover devices, pick one and control it interactively.
          </Text>
        </Box>
        <Text bold>Options:</Text>
        <Box marginLeft={2} marginTop={1} flexDirection="column">
          <Opt
            flag="--timeout <ms>"
            desc="Discovery timeout in ms (default: 3000)"
          />
          <Opt flag="--debug" desc="Log all device tx/rx frames to debug.log" />
        </Box>
      </>
    ),
    status: (
      <>
        <UsageLine cmd="status" />
        <Text bold>Options:</Text>
        <Box marginLeft={2} marginTop={1} flexDirection="column">
          <Opt
            flag="--ip <address>"
            desc="Device IP (auto-discover if omitted)"
          />
          <Opt
            flag="--timeout <ms>"
            desc="Discovery timeout in ms (default: 3000)"
          />
          <Opt
            flag="--commands"
            desc="Show supported commands list (requires SSDP)"
          />
          <Opt flag="--raw" desc="Dump all raw get_prop values" />
        </Box>
      </>
    ),
    power: (
      <>
        <UsageLine cmd="power" args="<on|off>" />
        <Text bold>Options:</Text>
        <StdOpts />
      </>
    ),
    brightness: (
      <>
        <UsageLine cmd="brightness" args="<1–100>" />
        <Text bold>Options:</Text>
        <StdOpts />
      </>
    ),
    ct: (
      <>
        <UsageLine cmd="ct" args="<1700–6500>" />
        <Text bold>Options:</Text>
        <StdOpts />
      </>
    ),
    color: (
      <>
        <UsageLine cmd="color" args="<#hex | r g b>" />
        <Box marginBottom={1} flexDirection="column">
          <Text dimColor>Alpha channel in hex sets brightness: </Text>
          <Text dimColor> #RRGGBBAA or #RGBA → brightness 0–100%</Text>
        </Box>
        <Text bold>Options:</Text>
        <StdOpts />
      </>
    ),
    segment: (
      <>
        <UsageLine cmd="segment" args="<left> <right>" />
        <Text bold>Options:</Text>
        <Box marginLeft={2} marginTop={1} flexDirection="column">
          <Opt
            flag="--ip <address>"
            desc="Device IP (auto-discover if omitted)"
          />
        </Box>
      </>
    ),
    toggle: (
      <>
        <UsageLine cmd="toggle" />
        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>
            Toggles both main and background channels simultaneously.
          </Text>
          <Text dimColor>
            Only works on dual-channel devices (e.g. Bedside Lamp 2).
          </Text>
        </Box>
        <Text bold>Options:</Text>
        <Box marginLeft={2} marginTop={1} flexDirection="column">
          <Opt
            flag="--ip <address>"
            desc="Device IP (auto-discover if omitted)"
          />
        </Box>
      </>
    ),
    name: (
      <>
        <UsageLine cmd="name" args="<name>" />
        <Text bold>Options:</Text>
        <Box marginLeft={2} marginTop={1} flexDirection="column">
          <Opt
            flag="--ip <address>"
            desc="Device IP (auto-discover if omitted)"
          />
        </Box>
      </>
    ),
    timer: (
      <>
        <UsageLine cmd="timer" args="<set <minutes> | cancel | status>" />
        <Text bold>Options:</Text>
        <Box marginLeft={2} marginTop={1} flexDirection="column">
          <Opt
            flag="--ip <address>"
            desc="Device IP (auto-discover if omitted)"
          />
        </Box>
      </>
    ),
    adjust: (
      <>
        <UsageLine cmd="adjust" args="<brightness|ct|color> [-100..100]" />
        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>
            Adjust by a relative percentage (-100 to 100). Color cycles without
            a value.
          </Text>
        </Box>
        <Text bold>Options:</Text>
        <StdOpts />
      </>
    )
  }

  const content = screens[cmd]
  return (
    <Box flexDirection="column" paddingY={1}>
      {content ?? <Text color="red">Unknown command: {cmd}</Text>}
    </Box>
  )
}
