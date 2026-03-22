import React, { useEffect, useState } from 'react'
import { Box, Text, useApp } from 'ink'
import type { ChannelCapabilities, ChannelState } from 'yeelight-client'
import { resolveDevice } from '../resolve'
import { ChannelStatus, PropRow } from '../components/ChannelStatus'
import { Dots } from '../components/Dots'
import { ErrorText } from '../components/ErrorText'

type StatusData = {
  ip: string
  model: string
  name: string
  main: ChannelState
  mainCaps: ChannelCapabilities
  bg: ChannelState | null
  bgCaps: ChannelCapabilities | null
  support: string[]
  raw: Record<string, string>
}

const rawPropNames = [
  'power',
  'bright',
  'ct',
  'rgb',
  'hue',
  'sat',
  'color_mode',
  'flowing',
  'flow_params',
  'bg_power',
  'bg_bright',
  'bg_ct',
  'bg_rgb',
  'bg_hue',
  'bg_sat',
  'bg_color_mode',
  'bg_flowing',
  'bg_flow_params',
  'active_mode',
  'nl_br',
  'delayoff',
  'music_on',
  'save_state',
  'name'
]

export function StatusCommand({
  ip,
  showRaw,
  showCommands,
  timeout
}: {
  ip?: string
  showRaw?: boolean
  showCommands?: boolean
  timeout?: number
}) {
  const { exit } = useApp()
  const [data, setData] = useState<StatusData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const device = await resolveDevice(ip, {
          withSupport: showCommands,
          timeout
        })
        const main = await device.main.getState()
        const bg = device.background ? await device.background.getState() : null
        const raw = showRaw ? await device.getRawProps(rawPropNames) : {}
        setData({
          ip: device.ip,
          model: device.model,
          name: device.name,
          main,
          mainCaps: device.capabilities.main,
          bg,
          bgCaps: device.capabilities.background,
          support: device.support,
          raw
        })
        device.disconnect()
      } catch (e: any) {
        setError(e.message)
        process.exitCode = 1
      } finally {
        exit()
      }
    })()
  }, [])

  if (error) return <ErrorText message={error} />
  if (!data)
    return (
      <Box marginTop={1}>
        <Text dimColor>
          Connecting
          <Dots />
        </Text>
      </Box>
    )

  return (
    <Box flexDirection="column" gap={1} marginTop={1}>
      <Box gap={2}>
        <Text bold color="cyan">
          {data.ip}
        </Text>
        {data.name && <Text bold>{data.name}</Text>}
        {data.model !== 'unknown' && <Text dimColor>({data.model})</Text>}
      </Box>
      <ChannelStatus label="Main channel:" s={data.main} caps={data.mainCaps} />
      {data.bg && (
        <ChannelStatus
          label="Background channel:"
          s={data.bg}
          caps={data.bgCaps ?? undefined}
        />
      )}
      {showCommands && data.support.length > 0 && (
        <Box flexDirection="column">
          <Text bold>Supported commands:</Text>
          <Box marginLeft={2}>
            <Text dimColor>{data.support.join(', ')}</Text>
          </Box>
        </Box>
      )}
      {showRaw && Object.keys(data.raw).length > 0 && (
        <Box flexDirection="column">
          <Text bold>Raw properties:</Text>
          <Box marginLeft={2} flexDirection="column">
            {Object.entries(data.raw).map(([k, v]) => (
              <PropRow key={k} k={k}>
                <Text dimColor>{v || '—'}</Text>
              </PropRow>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
