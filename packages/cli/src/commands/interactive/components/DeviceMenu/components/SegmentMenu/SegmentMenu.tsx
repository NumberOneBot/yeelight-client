import { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import type { YeelightDevice } from 'yeelight-client'
import { Dots } from '../../../../../../components/Dots'
import { HintBar } from '../../../HintBar'
import { SelectList } from '../../../SelectList'
import { RgbPicker } from '../RgbPicker'
import { SegRow } from './components/SegRow'
import type { RGB, SegItem } from './types'

type Stage = 'menu' | 'left' | 'right'

const segItems: SegItem[] = [
  { kind: 'left' },
  { kind: 'right' },
  { kind: 'apply' },
  { kind: 'back' }
]

export function SegmentMenu({
  device,
  initialLeft,
  initialRight,
  onBack,
  onQuit
}: {
  device: YeelightDevice
  initialLeft: RGB | null
  initialRight: RGB | null
  onBack: (left: RGB | null, right: RGB | null) => void
  onQuit: () => void
}) {
  const [stage, setStage] = useState<Stage>('menu')
  const [left, setLeft] = useState<RGB | null>(initialLeft)
  const [right, setRight] = useState<RGB | null>(initialRight)
  const [applying, setApplying] = useState(false)
  const [done, setDone] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const noColor = !!process.env.NO_COLOR

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 800)
    return () => clearTimeout(t)
  }, [done])

  function apply() {
    if (!left || !right || applying) return
    setApplying(true)
    setDone(false)
    setApplyError(null)
    void device
      .setSegments(left, right)
      .then(() => setDone(true))
      .catch((e: Error) => setApplyError(e.message))
      .finally(() => setApplying(false))
  }

  const header = (
    <Box gap={2} marginBottom={1}>
      <Text bold color="cyan">
        {device.ip}
      </Text>
      {device.name && <Text bold>{device.name}</Text>}
      {device.model !== 'unknown' && <Text dimColor>({device.model})</Text>}
    </Box>
  )

  if (stage === 'left' || stage === 'right') {
    const color = stage === 'left' ? left : right
    const title = stage === 'left' ? 'Left segment' : 'Right segment'
    return (
      <Box flexDirection="column" marginTop={1}>
        {header}
        <Box marginBottom={1}>
          <Text bold>{title}</Text>
        </Box>
        <RgbPicker
          current={color}
          onPick={(r, g, b) => {
            if (stage === 'left') setLeft([r, g, b])
            else setRight([r, g, b])
            setStage('menu')
          }}
          onCancel={() => setStage('menu')}
          onQuit={onQuit}
        />
        <HintBar back />
      </Box>
    )
  }

  const ready = left !== null && right !== null

  return (
    <Box flexDirection="column" marginTop={1}>
      {header}
      <Box marginBottom={1}>
        <Text bold>Segments</Text>
      </Box>
      <SelectList
        items={segItems}
        isSelectable={(item) => item.kind !== 'apply' || ready}
        onSelect={(item) => {
          if (item.kind === 'left') {
            setStage('left')
            return
          }
          if (item.kind === 'right') {
            setStage('right')
            return
          }
          if (item.kind === 'apply') {
            apply()
            return
          }
          if (item.kind === 'back') {
            onBack(left, right)
            return
          }
        }}
        onCancel={() => onBack(left, right)}
        onQuit={onQuit}
        renderItem={(item, focused) => (
          <SegRow
            item={item}
            focused={focused}
            left={left}
            right={right}
            ready={ready}
            noColor={noColor}
          />
        )}
      />
      <Box marginTop={1} minHeight={1}>
        {applying ? (
          <Box marginLeft={2}>
            <Text dimColor>
              <Dots />
            </Text>
          </Box>
        ) : (
          <>
            {done && <Text color="green">✓ Done</Text>}
            {applyError && <Text color="red">✗ {applyError}</Text>}
          </>
        )}
      </Box>
      <HintBar back />
    </Box>
  )
}
