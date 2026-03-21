import React, { useEffect, useState } from 'react'
import { Box, Text, useApp } from 'ink'
import { YeelightDevice } from 'yeelight-client'

type DeviceInfo = {
  ip: string
  name: string
  extras: string[]
}

export function DiscoverCommand({ timeout }: { timeout: number }) {
  const { exit } = useApp()
  const [devices, setDevices] = useState<DeviceInfo[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    YeelightDevice.discover({ timeout })
      .then((found) => {
        setDevices(
          found.map((d) => {
            const extras = [d.model]
            if (d.capabilities.hasBackground) extras.push('background')
            if (d.capabilities.hasSegments) extras.push('segments')
            return { ip: d.ip, name: d.name, extras }
          })
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
          <Text bold color="white">
            {d.name}
          </Text>
          <Text dimColor>({d.extras.join(' + ')})</Text>
        </Box>
      ))}
    </Box>
  )
}
