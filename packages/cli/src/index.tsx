#!/usr/bin/env bun
import React from 'react'
import { render } from 'ink'
import minimist from 'minimist'
import {
  AdjustCommand,
  BrightnessCommand,
  ColorCommand,
  CtCommand,
  DiscoverCommand,
  InteractiveCommand,
  NameCommand,
  PowerCommand,
  SegmentCommand,
  StatusCommand,
  TimerCommand,
  ToggleCommand
} from './commands'
import { HelpScreen, CommandHelpScreen } from './help'
import pkg from '../package.json'

const argv = minimist(process.argv.slice(2), {
  boolean: ['bg', 'help', 'version', 'raw', 'commands', 'debug'],
  string: ['ip'],
  default: { duration: 0, timeout: 3000 },
  alias: { h: 'help', V: 'version' }
})

const [subcmd, ...rest] = argv._

if (argv.version) {
  console.log(pkg.version)
  process.exit(0)
}

// ── Routing ────────────────────────────────────────────────────────────────────

const { ip, bg, duration, timeout, help, raw, commands, debug } = argv

async function main() {
  if (help && subcmd) {
    await render(<CommandHelpScreen cmd={subcmd} />).waitUntilExit()
    return
  }

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
      await render(
        <StatusCommand
          ip={ip}
          showRaw={raw}
          showCommands={commands}
          timeout={Number(timeout)}
        />
      ).waitUntilExit()
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

    case 'interactive':
    case 'i':
      await render(
        <InteractiveCommand timeout={Number(timeout)} debug={debug} />
      ).waitUntilExit()
      break

    case 'toggle':
      await render(<ToggleCommand ip={ip} />).waitUntilExit()
      break

    case 'name': {
      const name = rest[0]
      if (!name) {
        console.error('Usage: ylc name <name>')
        process.exit(1)
      }
      await render(<NameCommand name={name} ip={ip} />).waitUntilExit()
      break
    }

    case 'timer': {
      const action = rest[0]
      if (action !== 'set' && action !== 'cancel' && action !== 'status') {
        console.error('Usage: ylc timer <set <minutes> | cancel | status>')
        process.exit(1)
      }
      let minutes: number | undefined
      if (action === 'set') {
        minutes = Number(rest[1])
        if (!rest[1] || isNaN(minutes)) {
          console.error('Usage: ylc timer set <minutes>')
          process.exit(1)
        }
      }
      await render(
        <TimerCommand action={action} minutes={minutes} ip={ip} />
      ).waitUntilExit()
      break
    }

    case 'adjust': {
      const prop = rest[0]
      if (prop !== 'brightness' && prop !== 'ct' && prop !== 'color') {
        console.error('Usage: ylc adjust <brightness|ct|color> [-100..100]')
        process.exit(1)
      }
      let percentage: number | undefined
      if (prop !== 'color') {
        percentage = Number(rest[1])
        if (!rest[1] || isNaN(percentage)) {
          console.error(`Usage: ylc adjust ${prop} <-100..100>`)
          process.exit(1)
        }
      }
      await render(
        <AdjustCommand
          prop={prop}
          percentage={percentage}
          ip={ip}
          bg={bg}
          duration={Number(duration)}
        />
      ).waitUntilExit()
      break
    }

    default:
      await render(<HelpScreen />).waitUntilExit()
  }
}

await main()
