import React, { useEffect, useState, type ReactNode } from 'react'
import { Box, Text, useApp } from 'ink'
import { resolveDevice } from '../resolve'

type ChanState = {
  power: boolean
  brightness: number
  colorTemp: number | null
  rgb: [number, number, number] | null
}

function toHex(n: number) {
  return n.toString(16).padStart(2, '0')
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <Box gap={1}>
      <Box width={12}>
        <Text dimColor>{k}</Text>
      </Box>
      {children}
    </Box>
  )
}

function Channel({ label, s }: { label: string; s: ChanState }) {
  const hex = s.rgb
    ? `#${toHex(s.rgb[0])}${toHex(s.rgb[1])}${toHex(s.rgb[2])}`
    : undefined
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
          </Row>
        )}
        {s.rgb !== null && (
          <Row k="rgb">
            <Text color="yellow">{s.rgb.join(', ')}</Text>
            {!process.env.NO_COLOR && <Text color={hex}> ██</Text>}
          </Row>
        )}
      </Box>
    </Box>
  )
}

export function StatusCommand({ ip }: { ip?: string }) {
  const { exit } = useApp()
  const [data, setData] = useState<{
    main: ChanState
    bg: ChanState | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const device = await resolveDevice(ip)
        const main = await device.main.getState()
        const bg = device.background ? await device.background.getState() : null
        setData({ main, bg })
        device.disconnect()
      } catch (e: any) {
        setError(e.message)
        process.exitCode = 1
      } finally {
        exit()
      }
    })()
  }, [])

  if (error)
    return (
      <Text bold color="red">
        {error}
      </Text>
    )
  if (!data) return <Text dimColor>Connecting...</Text>

  return (
    <Box flexDirection="column" gap={1}>
      <Channel label="Main channel:" s={data.main} />
      {data.bg && <Channel label="Background channel:" s={data.bg} />}
    </Box>
  )
}
