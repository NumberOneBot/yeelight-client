import { useState } from 'react'
import { Box, useInput } from 'ink'
import type { ReactNode } from 'react'
import { isQuitKey } from '../../../utils/keys'

type Props<T> = {
  items: T[]
  renderItem: (item: T, focused: boolean) => ReactNode
  onSelect: (item: T) => void
  onCancel?: () => void
  onQuit?: () => void
  onCursorChange?: (cursor: number) => void
  isSelectable?: (item: T) => boolean
  initialCursor?: number
  /** Ignore navigation/selection while a command is in flight (quit still works) */
  disabled?: boolean
}

export function SelectList<T>({
  items,
  renderItem,
  onSelect,
  onCancel,
  onQuit,
  onCursorChange,
  isSelectable,
  initialCursor,
  disabled = false
}: Props<T>) {
  const sel = (i: number) => !isSelectable || isSelectable(items[i])

  const [cursor, setCursor] = useState(() => {
    if (
      initialCursor !== undefined &&
      initialCursor >= 0 &&
      initialCursor < items.length &&
      sel(initialCursor)
    )
      return initialCursor
    const idx = items.findIndex((_, i) => sel(i))
    return idx < 0 ? 0 : idx
  })

  function move(dir: 1 | -1) {
    let i = cursor + dir
    while (i >= 0 && i < items.length) {
      if (!isSelectable || isSelectable(items[i])) {
        setCursor(i)
        onCursorChange?.(i)
        return
      }
      i += dir
    }
  }

  useInput((input, key) => {
    if (isQuitKey(input)) {
      setCursor((c) => c)
      ;(onQuit ?? onCancel)?.()
      return
    }
    if (disabled) return
    if (key.upArrow) move(-1)
    if (key.downArrow) move(1)
    if (key.return && sel(cursor)) {
      setCursor((c) => c)
      onSelect(items[cursor])
    }
    if (key.escape || key.leftArrow) {
      setCursor((c) => c)
      onCancel?.()
    }
  })

  return (
    <Box flexDirection="column">
      {items.map((item, i) => (
        <Box key={i}>{renderItem(item, i === cursor)}</Box>
      ))}
    </Box>
  )
}
