import React, { useEffect, useState } from 'react'
import { Box, Text, useApp } from 'ink'
import { YeelightDevice } from 'yeelight-client'
import { Dots } from '../components/Dots'
import { ErrorText } from '../components/ErrorText'
import { channelCaps, DeviceInfo, DeviceRow } from '../components/DeviceRow'

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
        <Text dimColor>
          Scanning
          <Dots />
        </Text>
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
        <DeviceRow key={d.ip} device={d} />
      ))}
    </Box>
  )
}
