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

  const hasSubmenu =
    row.kind === 'brightness' || row.kind === 'ct' || row.kind === 'rgb'
  const isBack = row.kind === 'back'
  const disabled = hasSubmenu && state?.power !== true
  const active = focused && !disabled

  return (
    <Box gap={1} marginTop={row.sep ? 1 : 0}>
      <Text color={active ? 'cyan' : undefined}>{active ? '›' : ' '}</Text>
      <Box minWidth={14}>
        <Text bold={isBack && active} color={active ? 'cyan' : undefined} dimColor={disabled}>
          {row.label}
        </Text>
      </Box>
      <Text dimColor={disabled}>{hasSubmenu ? '›' : ' '} </Text>
      {!isBack && <RowValue row={row} state={state} disabled={disabled} />}
    </Box>
  )
}
