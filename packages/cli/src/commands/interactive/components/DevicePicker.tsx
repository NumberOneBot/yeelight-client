import React, { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import { YeelightDevice } from 'yeelight-client'
import { Dots } from '../../../components/Dots'
import { channelCaps, DeviceRow } from '../../../components/DeviceRow'
import { SelectList } from './SelectList'

type PickerItem = YeelightDevice | { type: 'rescan' } | { type: 'quit' }

export function DevicePicker({
  timeout,
  initialDevices = null,
  onDevicesFound,
  onSelect,
  onQuit
}: {
  timeout: number
  initialDevices?: YeelightDevice[] | null
  onDevicesFound?: (devices: YeelightDevice[]) => void
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
    YeelightDevice.discover({ timeout })
      .then((found) => {
        setDevices(found)
        onDevicesFound?.(found)
      })
      .catch((e: Error) => setError(e.message))
  }, [scanKey])

  if (!devices && !error)
    return (
      <Box marginTop={1}>
        <Text dimColor>
          Scanning
          <Dots />
        </Text>
      </Box>
    )

  const navItems: PickerItem[] = [{ type: 'rescan' }, { type: 'quit' }]
  const listItems: PickerItem[] = [...(devices ?? []), ...navItems]

  function handleSelect(item: PickerItem) {
    if ('type' in item) {
      if (item.type === 'rescan') {
        setScanKey((k) => k + 1)
        return
      }
      onQuit()
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
        <Box marginBottom={1}>
          <Text color="red">✗ {error}</Text>
        </Box>
      )}
      {devices?.length === 0 && (
        <Box marginBottom={1}>
          <Text dimColor>No devices found.</Text>
        </Box>
      )}
      <SelectList<PickerItem>
        items={listItems}
        onSelect={handleSelect}
        onCancel={onQuit}
        renderItem={(item, focused) => {
          if ('type' in item)
            return (
              <Box gap={1} marginTop={item.type === 'rescan' ? 1 : 0}>
                <Text color={focused ? 'cyan' : undefined}>
                  {focused ? '›' : ' '}
                </Text>
                <Text bold={focused} color={focused ? 'cyan' : undefined}>
                  {item.type === 'rescan' ? '↺ Rescan' : '✕ Quit'}
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

      <Box marginTop={3}>
        <Text dimColor>↑↓ navigate · Enter select · q quit</Text>
      </Box>
    </Box>
  )
}
