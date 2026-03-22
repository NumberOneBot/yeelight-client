import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { ctToColor, rgbHex } from '../../../../../utils/color'
import type { MenuRow } from '../rows'

export function RowValue({
  row,
  state
}: {
  row: MenuRow
  state: ChannelState | null
}) {
  const noColor = !!process.env.NO_COLOR

  if (row.kind === 'power') {
    if (!state) return <Text dimColor>…</Text>
    return (
      <Text bold color={state.power ? 'green' : 'red'}>
        {state.power ? 'on' : 'off'}
      </Text>
    )
  }
  if (row.kind === 'brightness') {
    if (!state) return <Text dimColor>…</Text>
    return <Text color="yellow">{state.brightness}%</Text>
  }
  if (row.kind === 'ct') {
    if (!state || state.colorTemp === null) return <Text dimColor>—</Text>
    return (
      <Box>
        <Text color="yellow">{state.colorTemp} K</Text>
        {!noColor && <Text color={ctToColor(state.colorTemp)}> ██</Text>}
      </Box>
    )
  }
  if (row.kind === 'rgb') {
    if (!state || state.rgb === null) return <Text dimColor>—</Text>
    const hex = rgbHex(...state.rgb)
    return (
      <Box>
        <Text color="yellow">{hex}</Text>
        {!noColor && <Text color={hex}> ██</Text>}
      </Box>
    )
  }
  return null
}
