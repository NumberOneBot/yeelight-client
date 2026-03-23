import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { ctToColor, rgbHex } from '../../../../../../utils/color'
import type { Prop } from './items'

export function CurrentValue({
  prop,
  current
}: {
  prop: Prop
  current: ChannelState | null
}) {
  const noColor = !!process.env.NO_COLOR
  if (!current) return <Text dimColor>…</Text>
  if (prop === 'brightness')
    return <Text color="yellow">{current.brightness}%</Text>
  if (prop === 'ct') {
    if (current.colorTemp === null) return <Text dimColor>—</Text>
    return (
      <Box>
        <Text color="yellow">{current.colorTemp} K</Text>
        {!noColor && (
          <>
            <Text> </Text>
            <Text color={ctToColor(current.colorTemp)}>██</Text>
          </>
        )}
      </Box>
    )
  }
  if (current.rgb === null) return <Text dimColor>—</Text>
  const hex = rgbHex(...current.rgb)
  return (
    <Box>
      <Text color="yellow">{hex}</Text>
      {!noColor && (
        <>
          <Text> </Text>
          <Text color={hex}>██</Text>
        </>
      )}
    </Box>
  )
}
