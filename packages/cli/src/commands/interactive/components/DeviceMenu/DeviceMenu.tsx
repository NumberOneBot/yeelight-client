import { useEffect, useMemo, useState } from 'react'
import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { YeelightDevice } from 'yeelight-client'
import { Dots } from '../../../../components/Dots'
import { HintBar } from '../HintBar'
import { SelectList } from '../SelectList'
import { buildRows, type MenuRow, type SubScreen } from './rows'
import { DeviceMenuItem } from './components/DeviceMenuItem'
import { PropertyMenu } from './components/PropertyMenu'

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
