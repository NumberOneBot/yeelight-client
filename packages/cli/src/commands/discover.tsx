import React, { useEffect, useState } from 'react'
import { Box, Text, useApp } from 'ink'
import { YeelightDevice } from 'yeelight-client'
import { ErrorText } from '../components/ErrorText'

type DeviceInfo = {
  ip: string
  name: string
  model: string
  main: string
  bg: string | null
  segments: boolean
}

function channelCaps(caps: {
  hasColor: boolean
  hasColorTemp: boolean
}): string {
  if (caps.hasColor && caps.hasColorTemp) return 'rgb+ct'
  if (caps.hasColor) return 'rgb'
  if (caps.hasColorTemp) return 'ct'
  return 'brightness'
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
            name: d.name,
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
  if (!devices) return <Text dimColor>Scanning...</Text>
  if (devices.length === 0) {
    return (
      <ErrorText message="No devices found. Make sure LAN Control is enabled." />
    )
  }

  return (
    <Box flexDirection="column">
      {devices.map((d) => (
        <Box key={d.ip} gap={2}>
          <Text color="cyan">{d.ip}</Text>
          <Text bold color="green">
            {d.name}
          </Text>
          <Text dimColor>
            {d.model} · main: {d.main}
            {d.bg ? ` · bg: ${d.bg}` : ''}
            {d.segments ? ' · segments' : ''}
          </Text>
        </Box>
      ))}
    </Box>
  )
}
