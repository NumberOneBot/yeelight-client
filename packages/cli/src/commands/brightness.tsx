import React from 'react'
import { useCommand } from '../useCommand'
import { resolveDevice } from '../resolve'
import { ErrorText } from '../components'

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
  const error = useCommand(async () => {
    const device = await resolveDevice(ip)
    const ch = bg ? device.background : device.main
    if (!ch) throw new Error('This device has no background channel')
    await ch.setBrightness(value, { duration })
    device.disconnect()
  })

  if (error) return <ErrorText message={error} />
  return null
}
