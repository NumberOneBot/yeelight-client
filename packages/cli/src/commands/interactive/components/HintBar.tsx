import React from 'react'
import { Box, Text } from 'ink'

export function HintBar({ back = false }: { back?: boolean }) {
  const nav = back ? '↑↓ navigate · ← back' : '↑↓ navigate'
  const hints = [nav, 'Enter select', 'q quit'].join(' · ')
  return (
    <Box marginTop={1}>
      <Text dimColor>{hints}</Text>
    </Box>
  )
}
