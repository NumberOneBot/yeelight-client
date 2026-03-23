import React from 'react'
import { useCommand } from '../useCommand'
import { resolveDevice } from '../resolve'
import { ErrorText } from '../components/ErrorText'

export function PowerCommand({
  state,
  ip,
  bg,
  duration
}: {
  state: 'on' | 'off'
  ip?: string
  bg?: boolean
  duration: number
}) {
  const error = useCommand(async () => {
    const device = await resolveDevice(ip)
    const ch = bg ? device.background : device.main
    if (!ch) throw new Error('This device has no background channel')
    await ch.setPower(state === 'on', { duration })
    device.disconnect()
  })

  if (error) return <ErrorText message={error} />
  return null
}
