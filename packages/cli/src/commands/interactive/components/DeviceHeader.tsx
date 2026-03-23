import { Box, Text } from 'ink'
import type { YeelightDevice } from 'yeelight-client'

export function DeviceHeader({ device }: { device: YeelightDevice }) {
  return (
    <Box gap={2} marginBottom={1}>
      <Text bold color="cyan">
        {device.ip}
      </Text>
      {device.name && <Text bold>{device.name}</Text>}
      {device.model !== 'unknown' && <Text dimColor>({device.model})</Text>}
    </Box>
  )
}
