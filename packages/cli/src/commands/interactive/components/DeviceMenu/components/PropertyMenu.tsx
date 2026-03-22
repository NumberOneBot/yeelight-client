import React, { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { YeelightDevice } from 'yeelight-client'
import { ctToColor, rgbHex } from '../../../../../utils/color'
import { Dots } from '../../../../../components/Dots'
import { HintBar } from '../../HintBar'
import { SelectList } from '../../SelectList'

type Prop = 'brightness' | 'ct' | 'rgb'

type BrightnessItem = { kind: 'brightness'; value: number }
type CtItem = { kind: 'ct'; value: number }
type RgbItem = { kind: 'rgb'; label: string; r: number; g: number; b: number }
type BackItem = { kind: 'back' }
type PropItem = BrightnessItem | CtItem | RgbItem | BackItem

const brightnessItems: PropItem[] = [
  ...[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => ({
    kind: 'brightness' as const,
    value: v
  })),
  { kind: 'back' as const }
]

const ctItems: PropItem[] = [
  ...[2700, 3000, 3500, 4000, 4500, 5000, 6000, 6500].map((v) => ({
    kind: 'ct' as const,
    value: v
  })),
  { kind: 'back' as const }
]

const rgbItems: PropItem[] = [
  { kind: 'rgb', label: 'red', r: 255, g: 0, b: 0 },
  { kind: 'rgb', label: 'orange', r: 255, g: 128, b: 0 },
  { kind: 'rgb', label: 'yellow', r: 255, g: 255, b: 0 },
  { kind: 'rgb', label: 'green', r: 0, g: 200, b: 0 },
  { kind: 'rgb', label: 'cyan', r: 0, g: 255, b: 255 },
  { kind: 'rgb', label: 'blue', r: 0, g: 0, b: 255 },
  { kind: 'rgb', label: 'purple', r: 128, g: 0, b: 255 },
  { kind: 'rgb', label: 'pink', r: 255, g: 0, b: 128 },
  { kind: 'rgb', label: 'white', r: 255, g: 255, b: 255 },
  { kind: 'rgb', label: 'warm white', r: 255, g: 180, b: 80 },
  { kind: 'rgb', label: 'custom', r: -1, g: -1, b: -1 },
  { kind: 'back' as const }
]

function propItems(prop: Prop): PropItem[] {
  if (prop === 'brightness') return brightnessItems
  if (prop === 'ct') return ctItems
  return rgbItems
}

function propLabel(prop: Prop): string {
  if (prop === 'brightness') return 'Brightness'
  if (prop === 'ct') return 'Color temperature'
  return 'Color'
}

function CurrentValue({
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
        {!noColor && <Text color={ctToColor(current.colorTemp)}> ██</Text>}
      </Box>
    )
  }
  if (current.rgb === null) return <Text dimColor>—</Text>
  const hex = rgbHex(...current.rgb)
  return (
    <Box>
      <Text color="yellow">{hex}</Text>
      {!noColor && <Text color={hex}> ██</Text>}
    </Box>
  )
}

export function PropertyMenu({
  device,
  channel,
  prop,
  current,
  onBack,
  onQuit
}: {
  device: YeelightDevice
  channel: 'main' | 'bg'
  prop: Prop
  current: ChannelState | null
  onBack: (state: ChannelState | null) => void
  onQuit: () => void
}) {
  const ch = channel === 'bg' ? device.background! : device.main
  const noColor = !!process.env.NO_COLOR
  const [liveState, setLiveState] = useState<ChannelState | null>(current)
  const [executing, setExecuting] = useState(false)
  const [done, setDone] = useState(false)
  const [execError, setExecError] = useState<string | null>(null)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 800)
    return () => clearTimeout(t)
  }, [done])

  function isCurrent(item: PropItem): boolean {
    if (!liveState) return false
    if (item.kind === 'brightness') return liveState.brightness === item.value
    if (item.kind === 'ct') return liveState.colorTemp === item.value
    if (item.kind === 'rgb') {
      if (!liveState.rgb || item.r < 0) return false
      return (
        liveState.rgb[0] === item.r &&
        liveState.rgb[1] === item.g &&
        liveState.rgb[2] === item.b
      )
    }
    return false
  }

  function execute(item: PropItem) {
    if (item.kind === 'back') {
      onBack(liveState)
      return
    }
    if (executing) return

    let promise: Promise<void> | null = null
    if (item.kind === 'brightness') {
      promise = ch.setBrightness(item.value)
    } else if (item.kind === 'ct') {
      promise = ch.setColorTemp(item.value)
    } else if (item.kind === 'rgb' && item.r >= 0) {
      promise = ch.setRGB(item.r, item.g, item.b)
    }
    if (!promise) return

    setExecuting(true)
    setDone(false)
    setExecError(null)
    void promise
      .then(() => {
        setDone(true)
        setLiveState((s) => {
          if (!s) return s
          if (item.kind === 'brightness')
            return { ...s, brightness: item.value }
          if (item.kind === 'ct')
            return { ...s, colorTemp: item.value, rgb: null }
          if (item.kind === 'rgb')
            return {
              ...s,
              rgb: [item.r, item.g, item.b] as [number, number, number],
              colorTemp: null
            }
          return s
        })
      })
      .catch((e: Error) => setExecError(e.message))
      .finally(() => setExecuting(false))
  }

  const items = propItems(prop)

  const initialCursor = (() => {
    const idx = items.findIndex((item) => isCurrent(item))
    return idx >= 0 ? idx : undefined
  })()

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box gap={2} marginBottom={1}>
        <Text bold color="cyan">
          {device.ip}
        </Text>
        <Text dimColor>({device.model})</Text>
      </Box>

      <Box gap={1} marginBottom={1}>
        <Text bold>{propLabel(prop)}</Text>
        <CurrentValue prop={prop} current={liveState} />
      </Box>

      <SelectList
        items={items}
        initialCursor={initialCursor}
        onSelect={execute}
        onCancel={() => onBack(liveState)}
        onQuit={onQuit}
        renderItem={(item, focused) => {
          if (item.kind === 'back')
            return (
              <Box gap={1} marginTop={1}>
                <Text color={focused ? 'cyan' : undefined}>
                  {focused ? '›' : ' '}
                </Text>
                <Text bold={focused} color={focused ? 'cyan' : undefined}>
                  ↩ Back
                </Text>
              </Box>
            )

          const cur = isCurrent(item)
          let label: string
          let swatch: React.ReactNode = null

          if (item.kind === 'brightness') {
            label = `${item.value}%`
          } else if (item.kind === 'ct') {
            label = `${item.value} K`
            if (!noColor)
              swatch = <Text color={ctToColor(item.value)}> ██</Text>
          } else {
            label = item.label
            if (!noColor && item.r >= 0)
              swatch = <Text color={rgbHex(item.r, item.g, item.b)}> ██</Text>
          }

          return (
            <Box gap={1}>
              <Text color={focused ? 'cyan' : undefined}>
                {focused ? '›' : ' '}
              </Text>
              <Text
                bold={focused || cur}
                color={cur ? 'green' : focused ? 'cyan' : undefined}
              >
                {label}
              </Text>
              {swatch}
            </Box>
          )
        }}
      />

      <Box marginTop={1} minHeight={1}>
        {executing ? (
          <Box marginLeft={2}>
            <Text dimColor>
              <Dots />
            </Text>
          </Box>
        ) : (
          <>
            {done && <Text color="green">✓ Done</Text>}
            {execError && <Text color="red">✗ {execError}</Text>}
          </>
        )}
      </Box>

      <HintBar back />
    </Box>
  )
}
