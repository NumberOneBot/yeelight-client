import { type ReactNode } from 'react'
import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { ctToColor, rgbHex } from '../utils/color'

export function StatRow({
  k,
  dim,
  children
}: {
  k: string
  dim?: boolean
  children: ReactNode
}) {
  return (
    <Box gap={1}>
      <Box minWidth={16}>
        <Text dimColor={dim}>{k}</Text>
      </Box>
      {children}
    </Box>
  )
}

export function ChannelStatus({
  label,
  s
}: {
  label: string
  s: ChannelState
}) {
  const noColor = !!process.env.NO_COLOR
  const hex = s.rgb ? rgbHex(...s.rgb) : undefined
  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      <Box marginLeft={2} flexDirection="column" marginTop={1}>
        <StatRow k="Power">
          <Text bold color={s.power ? 'green' : 'red'}>
            {s.power ? 'on' : 'off'}
          </Text>
        </StatRow>
        <StatRow k="Brightness">
          <Text color="yellow">{s.brightness}%</Text>
        </StatRow>
        {s.colorTemp !== null && (
          <StatRow k="Color temp">
            <Text color="yellow">{s.colorTemp} K</Text>
            {s.ctRange && (
              <Text dimColor>
                [{s.ctRange[0]} .. {s.ctRange[1]} K]
              </Text>
            )}
            {!noColor && <Text color={ctToColor(s.colorTemp)}> ██</Text>}
          </StatRow>
        )}
        {s.rgb !== null && (
          <StatRow k="Color">
            <Text color="yellow">{hex}</Text>
            {!noColor && <Text color={hex}> ██</Text>}
          </StatRow>
        )}
        {s.flowing && (
          <StatRow k="Flowing">
            <Text color="magenta">active</Text>
          </StatRow>
        )}
      </Box>
    </Box>
  )
}
