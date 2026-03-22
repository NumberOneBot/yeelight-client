import React, { useEffect, useMemo, useState } from 'react'
import { Box, Text } from 'ink'
import { YeelightDevice } from 'yeelight-client'
import { Dots } from '../../../components/Dots'
import { SelectList } from './SelectList'

type Action = {
  label: string
  dim?: string
  execute?: () => Promise<void>
  nav?: 'back' | 'quit'
}

function buildActions(device: YeelightDevice): Action[] {
  const { main: ch, background: bg } = device

  const actions: Action[] = [
    { label: 'Power', dim: 'toggle', execute: () => ch.toggle() },
    { label: 'Brightness', dim: '25%', execute: () => ch.setBrightness(25) },
    { label: 'Brightness', dim: '50%', execute: () => ch.setBrightness(50) },
    { label: 'Brightness', dim: '75%', execute: () => ch.setBrightness(75) },
    { label: 'Brightness', dim: '100%', execute: () => ch.setBrightness(100) }
  ]

  if (ch.capabilities.hasColorTemp) {
    actions.push(
      {
        label: 'Color temp',
        dim: '2700 K',
        execute: () => ch.setColorTemp(2700)
      },
      {
        label: 'Color temp',
        dim: '4000 K',
        execute: () => ch.setColorTemp(4000)
      },
      {
        label: 'Color temp',
        dim: '6500 K',
        execute: () => ch.setColorTemp(6500)
      }
    )
  }

  if (ch.capabilities.hasColor) {
    actions.push(
      { label: 'Color', dim: 'red', execute: () => ch.setRGB(255, 0, 0) },
      { label: 'Color', dim: 'green', execute: () => ch.setRGB(0, 200, 0) },
      { label: 'Color', dim: 'blue', execute: () => ch.setRGB(0, 0, 255) },
      {
        label: 'Color',
        dim: 'warm white',
        execute: () => ch.setRGB(255, 180, 80)
      }
    )
  }

  if (bg) {
    actions.push(
      { label: 'BG power', dim: 'toggle', execute: () => bg.toggle() },
      { label: 'BG color', dim: 'red', execute: () => bg.setRGB(255, 0, 0) },
      { label: 'BG color', dim: 'blue', execute: () => bg.setRGB(0, 0, 255) }
    )
  }

  actions.push({ label: '↩ Back to devices', nav: 'back' })
  actions.push({ label: '✕ Quit', nav: 'quit' })

  return actions
}

export function ActionMenu({
  device,
  onBack,
  onQuit
}: {
  device: YeelightDevice
  onBack: () => void
  onQuit: () => void
}) {
  const actions = useMemo(() => buildActions(device), [device])
  const [executing, setExecuting] = useState(false)
  const [done, setDone] = useState(false)
  const [execError, setExecError] = useState<string | null>(null)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 800)
    return () => clearTimeout(t)
  }, [done])

  function handleSelect(action: Action) {
    if (executing) return
    if (action.nav === 'back') {
      onBack()
      return
    }
    if (action.nav === 'quit') {
      onQuit()
      return
    }
    if (!action.execute) return
    setExecuting(true)
    setDone(false)
    setExecError(null)
    void action
      .execute()
      .then(() => setDone(true))
      .catch((e: Error) => setExecError(e.message))
      .finally(() => setExecuting(false))
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
        items={actions}
        onSelect={handleSelect}
        onCancel={onQuit}
        renderItem={(action, focused) => (
          <Box gap={1} marginTop={action.nav === 'back' ? 1 : 0}>
            <Text color={focused ? 'cyan' : undefined}>
              {focused ? '›' : ' '}
            </Text>
            {action.dim ? (
              <Box width={12}>
                <Text bold={focused} color={focused ? 'cyan' : undefined}>
                  {action.label}
                </Text>
              </Box>
            ) : (
              <Text bold={focused} color={focused ? 'cyan' : undefined}>
                {action.label}
              </Text>
            )}
            {action.dim && <Text dimColor>{action.dim}</Text>}
          </Box>
        )}
      />

      <Box marginTop={1} minHeight={1}>
        {executing && (
          <Text dimColor>
            Executing
            <Dots />
          </Text>
        )}
        {done && <Text color="green">✓ Done</Text>}
        {execError && <Text color="red">✗ {execError}</Text>}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑↓ navigate · Enter select · q quit</Text>
      </Box>
    </Box>
  )
}
