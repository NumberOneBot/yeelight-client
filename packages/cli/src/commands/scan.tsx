import { useEffect, useState } from 'react'
import { Box, Text, useApp } from 'ink'
import { scan } from 'yeelight-client'
import {
  type DeviceInfo,
  channelCaps,
  DeviceRow,
  Dots,
  ErrorText
} from '../components'

export function ScanCommand() {
  const { exit } = useApp()
  const [devices, setDevices] = useState<DeviceInfo[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    scan()
      .then((found) =>
        setDevices(
          found.map((d) => {
            const s = d.support
            const hasBg = s.includes('bg_set_power') || s.includes('bg_set_rgb')
            return {
              ip: d.ip,
              model: d.model,
              main: channelCaps({
                hasColor: s.includes('set_rgb') || s.includes('set_hsv'),
                hasColorTemp: s.includes('set_ct_abx')
              }),
              bg: hasBg
                ? channelCaps({
                    hasColor:
                      s.includes('bg_set_rgb') || s.includes('bg_set_hsv'),
                    hasColorTemp: s.includes('bg_set_ct_abx')
                  })
                : null,
              segments: s.includes('set_segment_rgb')
            }
          })
        )
      )
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
          Scanning subnet
          <Dots />
        </Text>
      </Box>
    )
  if (devices.length === 0)
    return (
      <ErrorText message="No devices found. Make sure LAN Control is enabled." />
    )

  return (
    <Box flexDirection="column" marginTop={1}>
      {devices.map((d) => (
        <DeviceRow key={d.ip} device={d} />
      ))}
    </Box>
  )
}
