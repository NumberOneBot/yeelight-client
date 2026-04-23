import { useEffect, useRef, useState } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { YeelightDevice } from 'yeelight-client'
import { Dots, ErrorText } from '../../components'
import { DeviceMenu, DevicePicker } from './components'

type Screen =
  | { id: 'pick' }
  | { id: 'connecting-ip'; ip: string }
  | { id: 'connecting'; device: YeelightDevice }
  | { id: 'menu'; device: YeelightDevice }
  | { id: 'disconnected' }
  | { id: 'error'; message: string }

export function InteractiveCommand({
  timeout,
  debug,
  ip,
  scanMethod = 'ssdp'
}: {
  timeout: number
  debug?: boolean
  ip?: string
  scanMethod?: 'ssdp' | 'tcp'
}) {
  const { exit } = useApp()
  const [screen, setScreen] = useState<Screen>(
    ip ? { id: 'connecting-ip', ip } : { id: 'pick' }
  )
  const [cachedDevices, setCachedDevices] = useState<YeelightDevice[] | null>(
    null
  )
  const [pickerCursor, setPickerCursor] = useState<number | undefined>(
    undefined
  )
  // Set to true before intentional disconnect so the listener doesn't fire
  const leaving = useRef(false)

  // Keep stdin in raw mode at all times so useInput in child screens
  // always works after screen transitions (Ink/Windows stdin pause issue).
  // Also handles q during connecting screens where no child useInput is active.
  useInput((input) => {
    if (input === 'q') onQuit()
  })

  useEffect(() => {
    if (screen.id !== 'menu') return
    leaving.current = false
    const { device } = screen
    const onDisconnect = () => {
      if (!leaving.current) setScreen({ id: 'disconnected' })
    }
    device.on('disconnect', onDisconnect)
    return () => {
      device.off('disconnect', onDisconnect)
    }
  }, [screen])

  useEffect(() => {
    if (screen.id !== 'connecting-ip') return
    YeelightDevice.connect(screen.ip)
      .then((device) => setScreen({ id: 'menu', device }))
      .catch((e: Error) => setScreen({ id: 'error', message: e.message }))
  }, [screen])

  useEffect(() => {
    if (screen.id !== 'disconnected') return
    if (ip) {
      exit()
      return
    }
    const t = setTimeout(() => setScreen({ id: 'pick' }), 2000)
    return () => clearTimeout(t)
  }, [screen])

  useEffect(() => {
    if (screen.id !== 'error') return
    process.exitCode = 1
    exit()
  }, [screen])

  function onPick(device: YeelightDevice) {
    setScreen({ id: 'connecting', device })
    void device
      .connect()
      .then(() => setScreen({ id: 'menu', device }))
      .catch((e: Error) => setScreen({ id: 'error', message: e.message }))
  }

  function onBack() {
    if (screen.id === 'menu') {
      leaving.current = true
      screen.device.disconnect()
    }
    if (ip) {
      exit()
      return
    }
    setScreen({ id: 'pick' })
  }

  function onQuit() {
    if (screen.id === 'menu') {
      leaving.current = true
      screen.device.disconnect()
    }
    exit()
  }

  if (screen.id === 'error') return <ErrorText message={screen.message} />

  if (screen.id === 'disconnected')
    return (
      <Box marginTop={1}>
        <Text color="yellow">
          {ip
            ? 'Connection lost.'
            : 'Connection lost. Returning to device list…'}
        </Text>
      </Box>
    )

  if (screen.id === 'pick')
    return (
      <DevicePicker
        timeout={timeout}
        scanMethod={scanMethod}
        initialDevices={cachedDevices}
        initialCursor={pickerCursor}
        onDevicesFound={setCachedDevices}
        onCursorChange={setPickerCursor}
        onSelect={onPick}
        onQuit={onQuit}
      />
    )

  if (screen.id === 'connecting-ip')
    return (
      <Box marginTop={1}>
        <Text dimColor>
          Connecting to {screen.ip}
          <Dots />
        </Text>
      </Box>
    )

  if (screen.id === 'connecting')
    return (
      <Box marginTop={1}>
        <Text dimColor>
          Connecting
          <Dots />
        </Text>
      </Box>
    )

  return (
    <DeviceMenu
      device={screen.device}
      onBack={onBack}
      onQuit={onQuit}
      debug={debug}
      canGoBack={!ip}
    />
  )
}
