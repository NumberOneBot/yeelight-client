#!/usr/bin/env bun
import React from 'react'
import { render, Box, Text, useApp } from 'ink'
import minimist from 'minimist'
import { DiscoverCommand } from './commands/discover.tsx'
import { StatusCommand } from './commands/status.tsx'
import { PowerCommand } from './commands/power.tsx'
import { BrightnessCommand } from './commands/brightness.tsx'
import { CtCommand } from './commands/ct.tsx'
import { ColorCommand } from './commands/color.tsx'
import { SegmentCommand } from './commands/segment.tsx'

const argv = minimist(process.argv.slice(2), {
  boolean: ['bg', 'help', 'version'],
  string: ['ip'],
  default: { duration: 0, timeout: 3000 },
  alias: { h: 'help', V: 'version' }
})

const [subcmd, ...rest] = argv._

if (argv.version) {
  console.log('0.1.0')
  process.exit(0)
}

// ── Help components ────────────────────────────────────────────────────────────

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
      <Box width={18}>
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

function HelpScreen() {
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
          <Cmd name="discover" desc="Discover devices on the network" />
          <Cmd name="status" desc="Show current device state" />
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
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text bold>Options:</Text>
        <Box marginLeft={2} marginTop={1} flexDirection="column">
          <Opt
            flag="--ip <address>"
            desc="Device IP (auto-discover if omitted)"
          />
          <Opt flag="--bg" desc="Target background channel" />
          <Opt
            flag="--duration <ms>"
            desc="Transition duration in ms (default: 0)"
          />
          <Opt
            flag="--timeout <ms>"
            desc="Discovery timeout in ms (default: 3000)"
          />
        </Box>
      </Box>
    </Box>
  )
}

// ── Routing ────────────────────────────────────────────────────────────────────

const { ip, bg, duration, timeout, help } = argv

async function main() {
  if (help || !subcmd) {
    await render(<HelpScreen />).waitUntilExit()
    return
  }

  switch (subcmd) {
    case 'discover':
      await render(
        <DiscoverCommand timeout={Number(timeout)} />
      ).waitUntilExit()
      break

    case 'status':
      await render(<StatusCommand ip={ip} />).waitUntilExit()
      break

    case 'power': {
      const state = rest[0]
      if (state !== 'on' && state !== 'off') {
        console.error('Usage: ylc power <on|off>')
        process.exit(1)
      }
      await render(
        <PowerCommand
          state={state}
          ip={ip}
          bg={bg}
          duration={Number(duration)}
        />
      ).waitUntilExit()
      break
    }

    case 'brightness':
    case 'br': {
      const val = Number(rest[0])
      if (!rest[0] || isNaN(val)) {
        console.error('Usage: ylc brightness <1-100>')
        process.exit(1)
      }
      await render(
        <BrightnessCommand
          value={val}
          ip={ip}
          bg={bg}
          duration={Number(duration)}
        />
      ).waitUntilExit()
      break
    }

    case 'ct': {
      const kelvin = Number(rest[0])
      if (!rest[0] || isNaN(kelvin)) {
        console.error('Usage: ylc ct <kelvin>')
        process.exit(1)
      }
      await render(
        <CtCommand
          kelvin={kelvin}
          ip={ip}
          bg={bg}
          duration={Number(duration)}
        />
      ).waitUntilExit()
      break
    }

    case 'color':
      await render(
        <ColorCommand raw={rest} ip={ip} bg={bg} duration={Number(duration)} />
      ).waitUntilExit()
      break

    case 'segment':
      await render(
        <SegmentCommand left={rest[0]} right={rest[1]} ip={ip} />
      ).waitUntilExit()
      break

    default:
      await render(<HelpScreen />).waitUntilExit()
  }
}

await main()
