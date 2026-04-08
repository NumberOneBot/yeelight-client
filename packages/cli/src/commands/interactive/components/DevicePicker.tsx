import React, { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import { YeelightDevice } from 'yeelight-client'
import { Dots } from '../../../components/Dots'
import { HintBar } from './HintBar'
import { channelCaps, DeviceRow } from '../../../components/DeviceRow'
import { SelectList } from './SelectList'

type PickerItem = YeelightDevice | { type: 'rescan' }

export function DevicePicker({
  timeout,
  scanMethod = 'ssdp',
  initialDevices = null,
  initialCursor,
  onDevicesFound,
  onCursorChange,
  onSelect,
  onQuit
}: {
  timeout: number
  scanMethod?: 'ssdp' | 'tcp'
  initialDevices?: YeelightDevice[] | null
  initialCursor?: number
  onDevicesFound?: (devices: YeelightDevice[]) => void
  onCursorChange?: (cursor: number) => void
  onSelect: (device: YeelightDevice) => void
  onQuit: () => void
}) {
  const [devices, setDevices] = useState<YeelightDevice[] | null>(
    initialDevices
  )
  const [error, setError] = useState<string | null>(null)
  const [scanKey, setScanKey] = useState(0)

  useEffect(() => {
    if (scanKey === 0 && initialDevices != null) return
    setDevices(null)
    setError(null)
    const discover =
      scanMethod === 'tcp'
        ? YeelightDevice.scan()
        : YeelightDevice.discover({ timeout })
    discover
      .then((found: YeelightDevice[]) => {
        const sorted = [...found].sort((a, b) => a.model.localeCompare(b.model))
        setDevices(sorted)
        onDevicesFound?.(sorted)
      })
      .catch((e: Error) => setError(e.message))
  }, [scanKey])

  if (!devices && !error)
    return (
      <Box marginTop={1}>
        <Text dimColor>
          {scanMethod === 'tcp' ? 'TCP scan' : 'Scanning'}
          <Dots />
        </Text>
      </Box>
    )

  const navItems: PickerItem[] = [{ type: 'rescan' }]
  const listItems: PickerItem[] = [...(devices ?? []), ...navItems]

  function handleSelect(item: PickerItem) {
    if ('type' in item) {
      setScanKey((k) => k + 1)
      return
    }
    onSelect(item)
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box marginBottom={1}>
        <Text bold>Select device</Text>
      </Box>

      {error && (
        <Box>
          <Text color="red">✗ {error}</Text>
        </Box>
      )}
      {devices?.length === 0 && (
        <Box>
          <Text dimColor>No devices found.</Text>
        </Box>
      )}

      <SelectList<PickerItem>
        items={listItems}
        initialCursor={initialCursor}
        onSelect={handleSelect}
        onQuit={onQuit}
        onCursorChange={onCursorChange}
        renderItem={(item, focused) => {
          if ('type' in item)
            return (
              <Box gap={1} marginTop={1}>
                <Text color={focused ? 'cyan' : undefined}>
                  {focused ? '›' : ' '}
                </Text>
                <Text bold={focused} color={focused ? 'cyan' : undefined}>
                  ↺ Rescan
                </Text>
              </Box>
            )
          return (
            <Box gap={1}>
              <Text color={focused ? 'cyan' : undefined}>
                {focused ? '›' : ' '}
              </Text>
              <DeviceRow
                device={{
                  ip: item.ip,
                  model: item.model,
                  main: channelCaps(item.main.capabilities),
                  bg: item.background
                    ? channelCaps(item.background.capabilities)
                    : null,
                  segments: item.capabilities.hasSegments
                }}
                focused={focused}
              />
            </Box>
          )
        }}
      />

      <HintBar />
    </Box>
  )
}
