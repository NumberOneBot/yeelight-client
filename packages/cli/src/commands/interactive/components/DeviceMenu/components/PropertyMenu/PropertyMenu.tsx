import { useRef } from 'react'
import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { YeelightDevice } from 'yeelight-client'
import { ActionFeedback } from '../../../ActionFeedback'
import { DeviceHeader } from '../../../DeviceHeader'
import { HintBar } from '../../../HintBar'
import { SelectList } from '../../../SelectList'
import { propItems, propLabel, type Prop, type RgbItem } from './items'
import { usePropertyExec } from './usePropertyExec'
import { CurrentValue } from './CurrentValue'
import { HexInput } from './HexInput'
import { PropRow } from './PropRow'

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
  const {
    liveState,
    executing,
    done,
    error,
    hexMode,
    setHexMode,
    isCurrent,
    applyRGB,
    execute
  } = usePropertyExec(ch, current, onBack)

  const items = propItems(prop)
  const cursorOverride = useRef<number | undefined>(undefined)
  const initialCursor =
    cursorOverride.current ??
    (() => {
      const idx = items.findIndex((item) => isCurrent(item))
      return idx >= 0 ? idx : undefined
    })()

  return (
    <Box flexDirection="column" marginTop={1}>
      <DeviceHeader device={device} />

      <Box gap={1} marginBottom={1}>
        <Text bold>{propLabel(prop)}</Text>
        <CurrentValue prop={prop} current={liveState} />
      </Box>

      {hexMode ? (
        <HexInput
          onConfirm={(r, g, b) => {
            setHexMode(false)
            applyRGB(r, g, b)
          }}
          onCancel={() => {
            cursorOverride.current = items.findIndex(
              (item) => item.kind === 'rgb' && (item as RgbItem).r < 0
            )
            setHexMode(false)
          }}
        />
      ) : (
        <SelectList
          items={items}
          initialCursor={initialCursor}
          onSelect={execute}
          onCancel={() => onBack(liveState)}
          onQuit={onQuit}
          renderItem={(item, focused) => (
            <PropRow
              item={item}
              focused={focused}
              cur={isCurrent(item)}
              liveState={liveState}
              prop={prop}
            />
          )}
        />
      )}

      <ActionFeedback executing={executing} done={done} error={error} />

      {!hexMode && <HintBar back />}
    </Box>
  )
}
