import React from 'react'
import { useCommand } from '../useCommand'
import { resolveDevice } from '../resolve'
import { ErrorText } from '../components'

export function NameCommand({ name, ip }: { name: string; ip?: string }) {
  const error = useCommand(async () => {
    const device = await resolveDevice(ip)
    await device.setName(name)
    device.disconnect()
  })

  if (error) return <ErrorText message={error} />
  return null
}
