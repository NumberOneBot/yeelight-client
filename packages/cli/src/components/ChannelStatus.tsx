import React, { type ReactNode } from 'react'
import { Box, Text } from 'ink'
import type { ChannelCapabilities, ChannelState } from 'yeelight-client'
import { ctToColor, rgbHex } from '../utils/color'

export function PropRow({ k, children }: { k: string; children: ReactNode }) {
  return (
    <Box>
      <Box minWidth={14}>
        <Text dimColor>{k}</Text>
      </Box>
      {children}
    </Box>
  )
}

export function ChannelStatus({
  label,
  s,
  caps
}: {
  label: string
  s: ChannelState
  caps?: ChannelCapabilities
}) {
  const noColor = !!process.env.NO_COLOR
  const hex = s.rgb ? rgbHex(...s.rgb) : undefined
  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      <Box marginLeft={2} flexDirection="column">
        <PropRow k="power">
          <Text bold color={s.power ? 'green' : 'red'}>
            {s.power ? 'on' : 'off'}
          </Text>
        </PropRow>
        <PropRow k="brightness">
          <Text color="yellow">{s.brightness}%</Text>
        </PropRow>
        {s.colorTemp !== null && (
          <PropRow k="color temp">
            <Text color="yellow">{s.colorTemp} K</Text>
            {!noColor && <Text color={ctToColor(s.colorTemp)}> ██</Text>}
          </PropRow>
        )}
        {caps?.hasColor &&
          caps.hasColorTemp &&
          (s.rgb !== null || s.colorTemp !== null) && (
            <PropRow k="color mode">
              <Text color="yellow">{s.colorTemp !== null ? 'ct' : 'rgb'}</Text>
            </PropRow>
          )}
        {s.rgb !== null && (
          <PropRow k="rgb">
            <Text color="yellow">{hex}</Text>
            {!noColor && <Text color={hex}> ██</Text>}
          </PropRow>
        )}
        {s.flowing && (
          <PropRow k="flowing">
            <Text color="magenta">active</Text>
          </PropRow>
        )}
      </Box>
    </Box>
  )
}
