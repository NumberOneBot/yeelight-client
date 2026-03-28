import { useEffect, useMemo, useState } from 'react'
import { appendFileSync } from 'node:fs'
import { Box } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { YeelightDevice } from 'yeelight-client'
import { ActionFeedback } from '../ActionFeedback'
import { DeviceHeader } from '../DeviceHeader'
import { HintBar } from '../HintBar'
import { SelectList } from '../SelectList'
import { buildRows, type MenuRow, type SubScreen } from './rows'
import { DeviceMenuItem } from './components/DeviceMenuItem'
import { PropertyMenu } from './components/PropertyMenu'
import { SegmentMenu } from './components/SegmentMenu'
import { useDeviceState } from './useDeviceState'

function dbg(event: string, data: unknown) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data)
  appendFileSync(
    'debug.log',
    `[${new Date().toISOString()}] ${event} ${payload}\n`
  )
}

export function DeviceMenu({
  device,
  onBack,
  onQuit,
  debug,
  canGoBack = true
}: {
  device: YeelightDevice
  onBack: () => void
  onQuit: () => void
  debug?: boolean
  canGoBack?: boolean
}) {
  const { mainState, bgState, updateState, togglePower, toggle } =
    useDeviceState(
      device,
      debug ? (ch, s) => dbg(`getState ${ch}`, s) : undefined
    )
  const [subscreen, setSubscreen] = useState<SubScreen | null>(null)
  const [segLeft, setSegLeft] = useState<[number, number, number] | null>(null)
  const [segRight, setSegRight] = useState<[number, number, number] | null>(
    null
  )
  const [savedCursor, setSavedCursor] = useState<number | undefined>(undefined)

  const rows = useMemo(() => buildRows(device, canGoBack), [device, canGoBack])

  useEffect(() => {
    if (!debug) return
    const handler = (params: unknown) => {
      dbg('push props', params)
    }
    const onTx = (frame: string) => dbg('→ tx', frame)
    const onRx = (frame: string) => dbg('← rx', frame)
    device.on('props', handler)
    device.on('tx', onTx)
    device.on('rx', onRx)
    return () => {
      device.off('props', handler)
      device.off('tx', onTx)
      device.off('rx', onRx)
    }
  }, [device, debug])

  function handlePropertyDone(state: ChannelState | null) {
    if (subscreen?.kind === 'property' && state) {
      updateState(subscreen.channel, state)
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
      togglePower(
        row.channel as 'main' | 'bg',
        debug ? (s) => dbg(`toggle ${row.channel}`, s) : undefined
      )
      return
    }

    if (row.kind === 'segments') {
      setSavedCursor(rows.indexOf(row))
      setSubscreen({ kind: 'segments' })
      return
    }

    if (
      row.channel &&
      (row.kind === 'brightness' || row.kind === 'ct' || row.kind === 'rgb')
    ) {
      setSavedCursor(rows.indexOf(row))
      setSubscreen({ kind: 'property', channel: row.channel, prop: row.kind })
    }
  }

  if (subscreen?.kind === 'segments') {
    return (
      <SegmentMenu
        device={device}
        initialLeft={segLeft}
        initialRight={segRight}
        onBack={(l, r) => {
          setSegLeft(l)
          setSegRight(r)
          setSubscreen(null)
        }}
        onApplied={() =>
          updateState('bg', bgState ? { ...bgState, power: true } : null)
        }
        onQuit={onQuit}
      />
    )
  }

  if (subscreen?.kind === 'property') {
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
      <DeviceHeader device={device} />

      <SelectList
        items={rows}
        initialCursor={savedCursor}
        isSelectable={(row) => {
          if (row.kind === 'section') return false
          if (
            row.kind === 'brightness' ||
            row.kind === 'ct' ||
            row.kind === 'rgb'
          ) {
            const chState = row.channel === 'bg' ? bgState : mainState
            return chState?.power === true
          }
          return true
        }}
        onSelect={handleSelect}
        onCancel={onBack}
        onQuit={onQuit}
        renderItem={(row, focused) => (
          <DeviceMenuItem
            row={row}
            focused={focused}
            state={row.channel === 'bg' ? bgState : mainState}
          />
        )}
      />

      <ActionFeedback
        executing={toggle.executing}
        done={toggle.done}
        error={toggle.error}
      />

      <HintBar back />
    </Box>
  )
}
