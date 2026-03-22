import React, { useState } from 'react'
import { Box, useInput } from 'ink'
import type { ReactNode } from 'react'

type Props<T> = {
  items: T[]
  renderItem: (item: T, focused: boolean) => ReactNode
  onSelect: (item: T) => void
  onCancel?: () => void
}

export function SelectList<T>({
  items,
  renderItem,
  onSelect,
  onCancel
}: Props<T>) {
  const [cursor, setCursor] = useState(0)

  useInput((input, key) => {
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1))
    if (key.downArrow) setCursor((c) => Math.min(items.length - 1, c + 1))
    if (key.return) onSelect(items[cursor])
    if (key.escape || input === 'q') onCancel?.()
  })

  return (
    <Box flexDirection="column">
      {items.map((item, i) => (
        <Box key={i}>{renderItem(item, i === cursor)}</Box>
      ))}
    </Box>
  )
}
