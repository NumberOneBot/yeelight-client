import React, { useEffect, useState } from 'react'
import { Box, Text, useApp } from 'ink'
import { YeelightDevice } from 'yeelight-client'

type DeviceInfo = {
  ip: string
  name: string
  model: string
  main: string
  bg: string | null
}

function channelCaps(caps: { hasColor: boolean; hasColorTemp: boolean }): string {
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
            bg: d.background ? channelCaps(d.background.capabilities) : null
          }))
        )
      })
      .catch((e: Error) => {
        setError(e.message)
        process.exitCode = 1
      })
      .finally(() => exit())
  }, [])

  if (error)
    return (
      <Text bold color="red">
        {error}
      </Text>
    )
  if (!devices) return <Text dimColor>Scanning...</Text>
  if (devices.length === 0) {
    return (
      <Text>
        No devices found. Make sure <Text bold>LAN Control</Text> is enabled.
      </Text>
    )
  }

  return (
    <Box flexDirection="column">
      {devices.map((d) => (
        <Box key={d.ip} gap={2}>
          <Text color="cyan">{d.ip}</Text>
          <Text bold>{d.name}</Text>
          <Text dimColor>
            {d.model} · main: {d.main}
            {d.bg ? ` · bg: ${d.bg}` : ''}
          </Text>
        </Box>
      ))}
    </Box>
  )
}
