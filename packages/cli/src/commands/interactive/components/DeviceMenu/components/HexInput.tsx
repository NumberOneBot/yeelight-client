import { useState } from 'react'
import { Box, Text, useInput } from 'ink'

export function HexInput({
  onConfirm,
  onCancel
}: {
  onConfirm: (r: number, g: number, b: number) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState('')
  const noColor = !!process.env.NO_COLOR

  useInput((input, key) => {
    if (key.escape || key.leftArrow) {
      onCancel()
      return
    }
    if (key.return) {
      if (value.length === 6) {
        onConfirm(
          parseInt(value.slice(0, 2), 16),
          parseInt(value.slice(2, 4), 16),
          parseInt(value.slice(4, 6), 16)
        )
      }
      return
    }
    if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1))
      return
    }
    if (/^[0-9a-fA-F]$/.test(input) && value.length < 6) {
      setValue((v) => v + input.toLowerCase())
    }
  })

  const full = value.length === 6
  const hex = `#${value}${'0'.repeat(6 - value.length)}`

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1}>
        <Text dimColor>#</Text>
        <Text color={full ? 'yellow' : undefined}>{value}</Text>
        <Text dimColor>{'_'.repeat(6 - value.length)}</Text>
        {!noColor && full && <Text color={hex}> ██</Text>}
      </Box>
      <Text dimColor>
        {full ? 'Enter confirm' : `${6 - value.length} digits left`} · ← back
      </Text>
    </Box>
  )
}
