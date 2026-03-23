import React from 'react'
import { useOneShot } from '../useOneShot'
import { resolveDevice } from '../resolve'
import { ErrorText } from '../components/ErrorText'

export function CtCommand({
  kelvin,
  ip,
  bg,
  duration
}: {
  kelvin: number
  ip?: string
  bg?: boolean
  duration: number
}) {
  const error = useOneShot(async () => {
    const device = await resolveDevice(ip)
    const ch = bg ? device.background : device.main
    if (!ch) throw new Error('This device has no background channel')
    await ch.setColorTemp(kelvin, { duration })
    device.disconnect()
  })

  if (error) return <ErrorText message={error} />
  return null
}
