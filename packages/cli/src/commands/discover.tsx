import React, { useEffect, useState } from 'react'
import { Box, Text, useApp } from 'ink'
import { YeelightDevice } from 'yeelight-client'
import { ErrorText } from '../components/ErrorText'

type DeviceInfo = {
  ip: string
  model: string
  main: string
  bg: string | null
  segments: boolean
}

type Caps = { hasColor: boolean; hasColorTemp: boolean }

function channelCaps(caps: Caps): string {
  if (caps.hasColor && caps.hasColorTemp) return 'ct+rgb'
  if (caps.hasColor) return 'rgb'
  if (caps.hasColorTemp) return 'ct'
  return 'brightness'
}

function CapsText({ value }: { value: string }) {
  if (value === 'ct+rgb')
    return (
      <>
        <Text color="cyanBright">ct</Text>
        <Text dimColor>+</Text>
        <Text color="redBright">rgb</Text>
      </>
    )
  if (value === 'ct') return <Text color="cyanBright">ct</Text>
  if (value === 'rgb') return <Text color="redBright">rgb</Text>
  return <Text color="yellow">brightness</Text>
}

export function DiscoverCommand({ timeout }: { timeout: number }) {
  const { exit } = useApp()
  const [devices, setDevices] = useState<DeviceInfo[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    YeelightDevice.discover({ timeout })
      .then((found) => {
        setDevices(
          found.map((d) => ({
            ip: d.ip,
            model: d.model,
            main: channelCaps(d.main.capabilities),
            bg: d.background ? channelCaps(d.background.capabilities) : null,
            segments: d.capabilities.hasSegments
          }))
        )
      })
      .catch((e: Error) => {
        setError(e.message)
        process.exitCode = 1
      })
      .finally(() => exit())
  }, [])

  if (error) return <ErrorText message={error} />
  if (!devices)
    return (
      <Box marginTop={1}>
        <Text dimColor>Scanning...</Text>
      </Box>
    )
  if (devices.length === 0) {
    return (
      <ErrorText message="No devices found. Make sure LAN Control is enabled." />
    )
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      {devices.map((d) => (
        <Box key={d.ip} gap={2}>
          <Text color="cyan">{d.ip}</Text>
          {d.model && <Text dimColor>({d.model})</Text>}
          <Box gap={1}>
            <Text dimColor>main:</Text>
            <CapsText value={d.main} />
            {d.bg && (
              <>
                <Text dimColor>·</Text>
                <Text dimColor>bg:</Text>
                <CapsText value={d.bg} />
              </>
            )}
            {d.segments && (
              <>
                <Text dimColor>+</Text>
                <Text color="green">segments</Text>
              </>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
