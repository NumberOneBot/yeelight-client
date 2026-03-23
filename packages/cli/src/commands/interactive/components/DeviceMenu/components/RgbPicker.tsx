import { useState } from 'react'
import { SelectList } from '../../SelectList'
import { HexInput } from './PropertyMenu/HexInput'
import { PropRow } from './PropertyMenu/PropRow'
import { rgbItems } from './PropertyMenu/items'

export function RgbPicker({
  current,
  onPick,
  onCancel,
  onQuit
}: {
  current?: readonly [number, number, number] | null
  onPick: (r: number, g: number, b: number) => void
  onCancel: () => void
  onQuit: () => void
}) {
  const [hexMode, setHexMode] = useState(false)

  if (hexMode) {
    return (
      <HexInput
        onConfirm={(r, g, b) => {
          setHexMode(false)
          onPick(r, g, b)
        }}
        onCancel={() => setHexMode(false)}
      />
    )
  }

  return (
    <SelectList
      items={rgbItems}
      onSelect={(item) => {
        if (item.kind === 'back') {
          onCancel()
          return
        }
        if (item.kind === 'rgb' && item.r < 0) {
          setHexMode(true)
          return
        }
        if (item.kind === 'rgb') onPick(item.r, item.g, item.b)
      }}
      onCancel={onCancel}
      onQuit={onQuit}
      renderItem={(item, focused) => (
        <PropRow
          item={item}
          focused={focused}
          cur={
            item.kind === 'rgb' &&
            item.r >= 0 &&
            !!current &&
            current[0] === item.r &&
            current[1] === item.g &&
            current[2] === item.b
          }
          liveState={null}
          prop="rgb"
        />
      )}
    />
  )
}
