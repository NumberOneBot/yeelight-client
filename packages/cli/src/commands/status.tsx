import React, { useEffect, useState, type ReactNode } from 'react'
import { Box, Text, useApp } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { resolveDevice } from '../resolve'
import { ErrorText } from '../components/ErrorText'

type StatusData = {
  ip: string
  model: string
  name: string
  main: ChannelState
  bg: ChannelState | null
  hasSegments: boolean
  support: string[]
  raw: Record<string, string>
}

const rawPropNames = [
  'power',
  'bright',
  'ct',
  'rgb',
  'hue',
  'sat',
  'color_mode',
  'flowing',
  'flow_params',
  'bg_power',
  'bg_bright',
  'bg_ct',
  'bg_rgb',
  'bg_hue',
  'bg_sat',
  'bg_color_mode',
  'bg_flowing',
  'bg_flow_params',
  'active_mode',
  'nl_br',
  'delayoff',
  'music_on',
  'save_state',
  'name'
]

function hex2(n: number) {
  return n.toString(16).padStart(2, '0').toUpperCase()
}

function rgbHex(r: number, g: number, b: number) {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`
}

function ctToColor(kelvin: number): string {
  const t = kelvin / 100
  let r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592
  r = Math.round(Math.max(0, Math.min(255, r)))
  let g =
    t <= 66
      ? 99.4708025861 * Math.log(t) - 161.1195681661
      : 288.1221695283 * (t - 60) ** -0.0755148492
  g = Math.round(Math.max(0, Math.min(255, g)))
  let b =
    t >= 66
      ? 255
      : t <= 19
        ? 0
        : 138.5177312231 * Math.log(t - 10) - 305.0447927307
  b = Math.round(Math.max(0, Math.min(255, b)))
  if (kelvin > 5000) {
    const cool = (kelvin - 5000) / 1500
    r = Math.round(Math.max(0, r - cool * 45))
    b = Math.round(Math.min(255, b + cool * 20))
  }
  return rgbHex(r, g, b)
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <Box>
      <Box minWidth={14}>
        <Text dimColor>{k}</Text>
      </Box>
      {children}
    </Box>
  )
}

function Channel({
  label,
  s,
  hasSegments
}: {
  label: string
  s: ChannelState
  hasSegments?: boolean
}) {
  const noColor = !!process.env.NO_COLOR
  const hex = s.rgb ? rgbHex(...s.rgb) : undefined
  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      <Box marginLeft={2} flexDirection="column">
        <Row k="power">
          <Text bold color={s.power ? 'green' : 'red'}>
            {s.power ? 'on' : 'off'}
          </Text>
        </Row>
        <Row k="brightness">
          <Text color="yellow">{s.brightness}%</Text>
        </Row>
        {s.colorTemp !== null && (
          <Row k="color temp">
            <Text color="yellow">{s.colorTemp}K</Text>
            {!noColor && <Text color={ctToColor(s.colorTemp)}> ██</Text>}
          </Row>
        )}
        {s.rgb !== null && (
          <Row k="rgb">
            <Text color="yellow">{hex}</Text>
            {!noColor && <Text color={hex}> ██</Text>}
          </Row>
        )}
        {s.flowing && (
          <Row k="flowing">
            <Text color="magenta">active</Text>
          </Row>
        )}
        {hasSegments && (
          <Row k="segments">
            <Text color="green">supported</Text>
          </Row>
        )}
      </Box>
    </Box>
  )
}

export function StatusCommand({
  ip,
  showRaw
}: {
  ip?: string
  showRaw?: boolean
}) {
  const { exit } = useApp()
  const [data, setData] = useState<StatusData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const device = await resolveDevice(ip)
        const main = await device.main.getState()
        const bg = device.background ? await device.background.getState() : null
        const raw = showRaw ? await device.getRawProps(rawPropNames) : {}
        setData({
          ip: device.ip,
          model: device.model,
          name: device.name,
          main,
          bg,
          hasSegments: device.capabilities.hasSegments,
          support: device.support,
          raw
        })
        device.disconnect()
      } catch (e: any) {
        setError(e.message)
        process.exitCode = 1
      } finally {
        exit()
      }
    })()
  }, [])

  if (error) return <ErrorText message={error} />
  if (!data) return <Text dimColor>Connecting...</Text>

  return (
    <Box flexDirection="column" gap={1} marginTop={1}>
      <Box gap={2}>
        <Text bold color="cyan">
          {data.ip}
        </Text>
        {data.name && <Text bold>{data.name}</Text>}
        {data.model !== 'unknown' && <Text dimColor>({data.model})</Text>}
      </Box>
      <Channel label="Main channel:" s={data.main} />
      {data.bg && (
        <Channel
          label="Background channel:"
          s={data.bg}
          hasSegments={data.hasSegments}
        />
      )}
      {data.support.length > 0 && (
        <Box flexDirection="column">
          <Text bold>Supported commands:</Text>
          <Box marginLeft={2}>
            <Text dimColor>{data.support.join(', ')}</Text>
          </Box>
        </Box>
      )}
      {showRaw && Object.keys(data.raw).length > 0 && (
        <Box flexDirection="column">
          <Text bold>Raw properties:</Text>
          <Box marginLeft={2} flexDirection="column">
            {Object.entries(data.raw).map(([k, v]) => (
              <Row key={k} k={k}>
                <Text dimColor>{v || '—'}</Text>
              </Row>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
