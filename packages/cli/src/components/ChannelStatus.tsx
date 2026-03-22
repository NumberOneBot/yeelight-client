import React, { type ReactNode } from 'react'
import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { ctToColor, rgbHex } from '../utils/color'

export function PropRow({
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
        <PropRow k="Power">
          <Text bold color={s.power ? 'green' : 'red'}>
            {s.power ? 'on' : 'off'}
          </Text>
        </PropRow>
        <PropRow k="Brightness">
          <Text color="yellow">{s.brightness}%</Text>
        </PropRow>
        {s.colorTemp !== null && (
          <PropRow k="Color temp">
            <Text color="yellow">{s.colorTemp} K</Text>
            {!noColor && <Text color={ctToColor(s.colorTemp)}> ██</Text>}
          </PropRow>
        )}
        {s.rgb !== null && (
          <PropRow k="Color">
            <Text color="yellow">{hex}</Text>
            {!noColor && <Text color={hex}> ██</Text>}
          </PropRow>
        )}
        {s.flowing && (
          <PropRow k="Flowing">
            <Text color="magenta">active</Text>
          </PropRow>
        )}
      </Box>
    </Box>
  )
}
