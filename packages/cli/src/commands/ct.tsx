import React, { useEffect, useState } from 'react'
import { useApp } from 'ink'
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
  const { exit } = useApp()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const device = await resolveDevice(ip)
        const ch = bg ? device.background : device.main
        if (!ch) throw new Error('This device has no background channel')
        await ch.setColorTemp(kelvin, { duration })
        device.disconnect()
      } catch (e: any) {
        setError(e.message)
        process.exitCode = 1
      } finally {
        exit()
      }
    })()
  }, [])

  if (error) return <ErrorText message={error} />
  return null
}
