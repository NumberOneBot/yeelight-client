import React, { useEffect, useMemo, useState } from 'react'
import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { YeelightDevice } from 'yeelight-client'
import { ctToColor, rgbHex } from '../../../../utils/color'
import { Dots } from '../../../../components/Dots'
import { HintBar } from '../HintBar'
import { SelectList } from '../SelectList'
import { PropertyMenu } from './components/PropertyMenu'

type RowKind = 'section' | 'power' | 'brightness' | 'ct' | 'rgb' | 'back'

type MenuRow = {
  kind: RowKind
  label: string
  channel: 'main' | 'bg' | null
  sep?: boolean
}

type SubScreen = {
  channel: 'main' | 'bg'
  prop: 'brightness' | 'ct' | 'rgb'
}

function buildRows(device: YeelightDevice): MenuRow[] {
  const { main: ch, background: bg } = device
  const rows: MenuRow[] = [
    { kind: 'section', label: 'Main channel', channel: null },
    { kind: 'power', label: 'Power', channel: 'main' },
    { kind: 'brightness', label: 'Brightness', channel: 'main' }
  ]
  if (ch.capabilities.hasColorTemp)
    rows.push({ kind: 'ct', label: 'Color temp', channel: 'main' })
  if (ch.capabilities.hasColor)
    rows.push({ kind: 'rgb', label: 'Color', channel: 'main' })

  if (bg) {
    rows.push({
      kind: 'section',
      label: 'Background channel',
      channel: null,
      sep: true
    })
    rows.push({ kind: 'power', label: 'Power', channel: 'bg' })
    rows.push({ kind: 'brightness', label: 'Brightness', channel: 'bg' })
    if (bg.capabilities.hasColorTemp)
      rows.push({ kind: 'ct', label: 'Color temp', channel: 'bg' })
    if (bg.capabilities.hasColor)
      rows.push({ kind: 'rgb', label: 'Color', channel: 'bg' })
  }

  rows.push({
    kind: 'back',
    label: '↩ Back to devices',
    channel: null,
    sep: true
  })
  return rows
}

export function DeviceMenu({
  device,
  onBack,
  onQuit
}: {
  device: YeelightDevice
  onBack: () => void
  onQuit: () => void
}) {
  const [mainState, setMainState] = useState<ChannelState | null>(null)
  const [bgState, setBgState] = useState<ChannelState | null>(null)
  const [subscreen, setSubscreen] = useState<SubScreen | null>(null)
  const [savedCursor, setSavedCursor] = useState<number | undefined>(undefined)
  const [toggling, setToggling] = useState(false)
  const [toggleDone, setToggleDone] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const rows = useMemo(() => buildRows(device), [device])
  const noColor = !!process.env.NO_COLOR

  useEffect(() => {
    device.main
      .getState()
      .then(setMainState)
      .catch(() => {})
    device.background
      ?.getState()
      .then(setBgState)
      .catch(() => {})
  }, [device])

  useEffect(() => {
    if (!toggleDone) return
    const t = setTimeout(() => setToggleDone(false), 800)
    return () => clearTimeout(t)
  }, [toggleDone])

  useEffect(() => {
    const t = setInterval(() => {
      device.getRawProps(['power']).catch(() => {})
    }, 30_000)
    return () => clearInterval(t)
  }, [device])

  function handlePropertyDone(state: ChannelState | null) {
    if (subscreen && state) {
      if (subscreen.channel === 'bg') setBgState(state)
      else setMainState(state)
    }
    setSubscreen(null)
  }

  function handleSelect(row: MenuRow) {
    if (row.kind === 'back') {
      onBack()
      return
    }
    if (row.kind === 'section') return

    if (row.kind === 'power') {
      const ch = row.channel === 'bg' ? device.background! : device.main
      setToggling(true)
      setToggleDone(false)
      setToggleError(null)
      void ch
        .toggle()
        .then(() => ch.getState())
        .then((state) => {
          if (row.channel === 'bg') setBgState(state)
          else setMainState(state)
          setToggleDone(true)
        })
        .catch((e: Error) => setToggleError(e.message))
        .finally(() => setToggling(false))
      return
    }

    if (
      row.channel &&
      (row.kind === 'brightness' || row.kind === 'ct' || row.kind === 'rgb')
    ) {
      setSavedCursor(rows.indexOf(row))
      setSubscreen({ channel: row.channel, prop: row.kind })
    }
  }

  function renderValue(row: MenuRow): React.ReactNode {
    const s = row.channel === 'bg' ? bgState : mainState
    if (row.kind === 'power') {
      if (!s) return <Text dimColor>…</Text>
      return (
        <Text bold color={s.power ? 'green' : 'red'}>
          {s.power ? 'on' : 'off'}
        </Text>
      )
    }
    if (row.kind === 'brightness') {
      if (!s) return <Text dimColor>…</Text>
      return <Text color="yellow">{s.brightness}%</Text>
    }
    if (row.kind === 'ct') {
      if (!s || s.colorTemp === null) return <Text dimColor>—</Text>
      return (
        <Box>
          <Text color="yellow">{s.colorTemp} K</Text>
          {!noColor && <Text color={ctToColor(s.colorTemp)}> ██</Text>}
        </Box>
      )
    }
    if (row.kind === 'rgb') {
      if (!s || s.rgb === null) return <Text dimColor>—</Text>
      const hex = rgbHex(...s.rgb)
      return (
        <Box>
          <Text color="yellow">{hex}</Text>
          {!noColor && <Text color={hex}> ██</Text>}
        </Box>
      )
    }
    return null
  }

  if (subscreen) {
    return (
      <PropertyMenu
        device={device}
        channel={subscreen.channel}
        prop={subscreen.prop}
        current={subscreen.channel === 'bg' ? bgState : mainState}
        onBack={handlePropertyDone}
        onQuit={onQuit}
      />
    )
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box gap={2} marginBottom={1}>
        <Text bold color="cyan">
          {device.ip}
        </Text>
        <Text dimColor>({device.model})</Text>
      </Box>

      <SelectList
        items={rows}
        initialCursor={savedCursor}
        isSelectable={(row) => row.kind !== 'section'}
        onSelect={handleSelect}
        onCancel={onBack}
        onQuit={onQuit}
        renderItem={(row, focused) => {
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
          return (
            <Box gap={1} marginTop={row.sep ? 1 : 0}>
              <Text color={focused ? 'cyan' : undefined}>
                {focused ? '›' : ' '}
              </Text>
              <Box minWidth={14}>
                <Text
                  bold={isBack && focused}
                  color={focused ? 'cyan' : undefined}
                >
                  {row.label}
                </Text>
              </Box>
              <Text dimColor={!hasSubmenu}>{hasSubmenu ? '›' : ' '} </Text>
              {!isBack && renderValue(row)}
            </Box>
          )
        }}
      />

      <Box marginTop={1} minHeight={1}>
        {toggling ? (
          <Box marginLeft={2}>
            <Text dimColor>
              <Dots />
            </Text>
          </Box>
        ) : (
          <>
            {toggleDone && <Text color="green">✓ Done</Text>}
            {toggleError && <Text color="red">✗ {toggleError}</Text>}
          </>
        )}
      </Box>

      <HintBar back />
    </Box>
  )
}
