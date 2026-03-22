import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import type { MenuRow } from '../rows'
import { RowValue } from './RowValue'

export function DeviceMenuItem({
  row,
  focused,
  state
}: {
  row: MenuRow
  focused: boolean
  state: ChannelState | null
}) {
  if (row.kind === 'section') {
    return (
      <Box marginTop={row.sep ? 1 : 0} marginBottom={1}>
        <Text bold>{row.label}</Text>
      </Box>
    )
  }

  const hasSubmenu = row.kind === 'brightness' || row.kind === 'ct' || row.kind === 'rgb'
  const isBack = row.kind === 'back'

  return (
    <Box gap={1} marginTop={row.sep ? 1 : 0}>
      <Text color={focused ? 'cyan' : undefined}>{focused ? '›' : ' '}</Text>
      <Box minWidth={14}>
        <Text bold={isBack && focused} color={focused ? 'cyan' : undefined}>
          {row.label}
        </Text>
      </Box>
      <Text dimColor={!hasSubmenu}>{hasSubmenu ? '›' : ' '} </Text>
      {!isBack && <RowValue row={row} state={state} />}
    </Box>
  )
}
