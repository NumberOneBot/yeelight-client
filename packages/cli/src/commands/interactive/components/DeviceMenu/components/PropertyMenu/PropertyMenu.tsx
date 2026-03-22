import { Box, Text } from 'ink'
import type { ChannelState } from 'yeelight-client'
import { YeelightDevice } from 'yeelight-client'
import { Dots } from '../../../../../../components/Dots'
import { HintBar } from '../../../HintBar'
import { SelectList } from '../../../SelectList'
import { propItems, propLabel, type Prop } from './items'
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
  const { liveState, executing, done, execError, hexMode, setHexMode, isCurrent, applyRGB, execute } =
    usePropertyExec(ch, current, onBack)

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

      {hexMode ? (
        <HexInput
          onConfirm={(r, g, b) => {
            setHexMode(false)
            applyRGB(r, g, b)
          }}
          onCancel={() => setHexMode(false)}
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

      {!hexMode && <HintBar back />}
    </Box>
  )
}
