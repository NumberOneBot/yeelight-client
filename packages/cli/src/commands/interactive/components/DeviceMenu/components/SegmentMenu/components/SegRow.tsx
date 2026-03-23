import { Box, Text } from 'ink'
import { rgbHex } from '../../../../../../../utils/color'
import type { RGB, SegItem } from '../types'

export function SegRow({
  item,
  focused,
  left,
  right,
  ready,
  noColor
}: {
  item: SegItem
  focused: boolean
  left: RGB | null
  right: RGB | null
  ready: boolean
  noColor: boolean
}) {
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

  if (item.kind === 'apply') {
    const active = focused && ready
    return (
      <Box gap={1} marginTop={1}>
        <Text color={active ? 'cyan' : undefined}>{active ? '›' : ' '}</Text>
        <Text
          bold={active}
          color={active ? 'cyan' : undefined}
          dimColor={!ready}
        >
          Apply
        </Text>
      </Box>
    )
  }

  const color = item.kind === 'left' ? left : right
  const label = item.kind === 'left' ? 'Left' : 'Right'
  const hex = color ? rgbHex(...color) : null

  return (
    <Box gap={1}>
      <Text color={focused ? 'cyan' : undefined}>{focused ? '›' : ' '}</Text>
      <Box minWidth={8}>
        <Text color={focused ? 'cyan' : undefined}>{label}</Text>
      </Box>
      <Text>›</Text>
      {hex && (
        <Box gap={1}>
          <Text color="yellow">{hex}</Text>
          {!noColor && <Text color={hex}>██</Text>}
        </Box>
      )}
    </Box>
  )
}
