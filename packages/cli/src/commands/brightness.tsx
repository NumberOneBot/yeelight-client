import React, { useEffect, useState } from 'react'
import { Text, useApp } from 'ink'
import { resolveDevice } from '../resolve'

export function BrightnessCommand({
  value,
  ip,
  bg,
  duration
}: {
  value: number
  ip?: string
  bg?: boolean
  duration: number
}) {
  const { exit } = useApp()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const device = await resolveDevice(ip)
        const ch = bg ? device.background : device.main
        if (!ch) throw new Error('This device has no background channel')
        await ch.setBrightness(value, { duration })
        device.disconnect()
      } catch (e: any) {
        setError(e.message)
        process.exitCode = 1
      } finally {
        exit()
      }
    })()
  }, [])

  if (error)
    return (
      <Text bold color="red">
        {error}
      </Text>
    )
  return null
}
