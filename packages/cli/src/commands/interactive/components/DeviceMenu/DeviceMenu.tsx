import { useEffect, useMemo, useState } from 'react'
import { appendFileSync } from 'node:fs'
import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { YeelightDevice } from 'yeelight-client'
import { Dots } from '../../../../components/Dots'
import { HintBar } from '../HintBar'
import { SelectList } from '../SelectList'
import { buildRows, type MenuRow, type SubScreen } from './rows'
import { DeviceMenuItem } from './components/DeviceMenuItem'
import { PropertyMenu } from './components/PropertyMenu'
import { SegmentMenu } from './components/SegmentMenu'

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
  debug
}: {
  device: YeelightDevice
  onBack: () => void
  onQuit: () => void
  debug?: boolean
}) {
  const [mainState, setMainState] = useState<ChannelState | null>(null)
  const [bgState, setBgState] = useState<ChannelState | null>(null)
  const [subscreen, setSubscreen] = useState<SubScreen | null>(null)
  const [segLeft, setSegLeft] = useState<[number, number, number] | null>(null)
  const [segRight, setSegRight] = useState<[number, number, number] | null>(
    null
  )
  const [savedCursor, setSavedCursor] = useState<number | undefined>(undefined)
  const [toggling, setToggling] = useState(false)
  const [toggleDone, setToggleDone] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const rows = useMemo(() => buildRows(device), [device])

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

  useEffect(() => {
    device.main
      .getState()
      .then((s) => {
        if (debug) dbg('getState main', s)
        setMainState(s)
      })
      .catch(() => {})
    device.background
      ?.getState()
      .then((s) => {
        if (debug) dbg('getState bg', s)
        setBgState(s)
      })
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
    if (subscreen?.kind === 'property' && state) {
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
          if (debug) dbg(`toggle ${row.channel}`, state)
          if (row.channel === 'bg') setBgState(state)
          else setMainState(state)
          setToggleDone(true)
        })
        .catch((e: Error) => setToggleError(e.message))
        .finally(() => setToggling(false))
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
        onApplied={() => setBgState((s) => s ? { ...s, power: true } : s)}
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
      <Box gap={2} marginBottom={1}>
        <Text bold color="cyan">
          {device.ip}
        </Text>
        {device.name && <Text bold>{device.name}</Text>}
        {device.model !== 'unknown' && <Text dimColor>({device.model})</Text>}
      </Box>

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
