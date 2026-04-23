import { Box, Text } from 'ink'

export type DeviceInfo = {
  ip: string
  model: string
  main: string
  bg: string | null
  segments: boolean
}

type Caps = { hasColor: boolean; hasColorTemp: boolean }

export function channelCaps(caps: Caps): string {
  if (caps.hasColor && caps.hasColorTemp) return 'ct+rgb'
  if (caps.hasColor) return 'rgb'
  if (caps.hasColorTemp) return 'ct'
  return 'brightness'
}

export function CapsText({ value }: { value: string }) {
  if (value === 'ct+rgb')
    return (
      <>
        <Text color="white">Color temp</Text>
        <Text dimColor>+</Text>
        <Text color="redBright">RGB</Text>
      </>
    )
  if (value === 'ct') return <Text color="white">Color temp</Text>
  if (value === 'rgb') return <Text color="redBright">RGB</Text>
  return <Text color="yellow">Brightness</Text>
}

export function DeviceRow({
  device,
  focused
}: {
  device: DeviceInfo
  focused?: boolean
}) {
  return (
    <Box gap={2}>
      <Box minWidth={15}>
        <Text bold={focused} color={focused ? 'cyan' : undefined}>
          {device.ip}
        </Text>
      </Box>
      <Box minWidth={12}>
        {device.model && <Text dimColor>({device.model})</Text>}
      </Box>
      <Box gap={1}>
        <Text dimColor>main:</Text>
        <CapsText value={device.main} />
        {device.bg && (
          <>
            <Text dimColor>+</Text>
            <Text dimColor>bg:</Text>
            <CapsText value={device.bg} />
          </>
        )}
        {device.segments && (
          <>
            <Text dimColor>+</Text>
            <Text color="greenBright">Segments</Text>
          </>
        )}
      </Box>
    </Box>
  )
}
