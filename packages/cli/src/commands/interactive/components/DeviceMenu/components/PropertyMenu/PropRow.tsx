import { type JSX } from 'react'
import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { ctToColor, rgbHex } from '../../../../../../utils/color'
import type { Prop, PropItem } from './items'

export function PropRow({
  item,
  focused,
  cur,
  liveState,
  prop
}: {
  item: PropItem
  focused: boolean
  cur: boolean
  liveState: ChannelState | null
  prop: Prop
}) {
  const noColor = !!process.env.NO_COLOR

  if (item.kind === 'back') {
    return (
      <Box gap={1} marginTop={1}>
        <Text color={focused ? 'cyan' : undefined}>{focused ? '›' : ' '}</Text>
        <Text bold={focused} color={focused ? 'cyan' : undefined}>
          ↩ Back
        </Text>
      </Box>
    )
  }

  const labelWidth = prop === 'rgb' ? 8 : prop === 'ct' ? 6 : 4
  let label: string
  let hexStr: string | null = null
  let swatch: JSX.Element | null = null

  if (item.kind === 'brightness') {
    label = `${item.value}%`
  } else if (item.kind === 'ct') {
    label = `${item.value} K`
    if (!noColor) swatch = <Text color={ctToColor(item.value)}> ██</Text>
  } else {
    label = item.label.charAt(0).toUpperCase() + item.label.slice(1)
    if (item.r >= 0) {
      const hex = rgbHex(item.r, item.g, item.b)
      hexStr = hex
      if (!noColor) swatch = <Text color={hex}> ██</Text>
    } else if (cur && liveState?.rgb) {
      const hex = rgbHex(...liveState.rgb)
      hexStr = hex
      if (!noColor) swatch = <Text color={hex}> ██</Text>
    }
  }

  const isCustom = item.kind === 'rgb' && item.r < 0

  return (
    <Box gap={1} marginTop={isCustom ? 1 : 0}>
      <Text color={focused ? 'cyan' : undefined}>{focused ? '›' : ' '}</Text>
      <Box minWidth={labelWidth}>
        <Text
          bold={focused || cur}
          color={cur ? 'green' : focused ? 'cyan' : undefined}
        >
          {label}
        </Text>
      </Box>
      {item.kind === 'rgb' && <Text>{isCustom ? '›' : ' '}</Text>}
      {hexStr && (
        <Text
          color={cur ? 'green' : focused ? 'cyan' : undefined}
          dimColor={!cur && !focused}
        >
          {hexStr}
        </Text>
      )}
      {swatch}
    </Box>
  )
}
