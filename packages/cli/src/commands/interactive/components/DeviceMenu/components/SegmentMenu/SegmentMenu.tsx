import { useState } from 'react'
import { Box, Text } from 'ink'
import type { YeelightDevice } from 'yeelight-client'
import { useAsyncAction } from '../../../../useAsyncAction'
import { ActionFeedback, DeviceHeader, HintBar, SelectList } from '../../../'
import { RgbPicker } from '../'
import { SegRow } from './components'
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
  onApplied,
  onQuit
}: {
  device: YeelightDevice
  initialLeft: RGB | null
  initialRight: RGB | null
  onBack: (left: RGB | null, right: RGB | null) => void
  onApplied?: () => void
  onQuit: () => void
}) {
  const [stage, setStage] = useState<Stage>('menu')
  const [left, setLeft] = useState<RGB | null>(initialLeft)
  const [right, setRight] = useState<RGB | null>(initialRight)
  const action = useAsyncAction()
  const noColor = !!process.env.NO_COLOR

  function apply() {
    if (!left || !right) return
    action.run(async () => {
      await device.setSegments(left, right)
      onApplied?.()
    })
  }

  if (stage === 'left' || stage === 'right') {
    const color = stage === 'left' ? left : right
    const title = stage === 'left' ? 'Left segment' : 'Right segment'
    return (
      <Box flexDirection="column" marginTop={1}>
        <DeviceHeader device={device} />
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
      <DeviceHeader device={device} />
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
      <ActionFeedback
        executing={action.executing}
        done={action.done}
        error={action.error}
      />
      <HintBar back />
    </Box>
  )
}
