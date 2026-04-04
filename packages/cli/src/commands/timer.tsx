import React, { useEffect, useState } from 'react'
import { Box, Text, useApp } from 'ink'
import type { CronTimer } from 'yeelight-client'
import { useCommand } from '../useCommand'
import { resolveDevice } from '../resolve'
import { ErrorText } from '../components'

type TimerAction = 'set' | 'cancel' | 'status'

export function TimerCommand({
  action,
  minutes,
  ip
}: {
  action: TimerAction
  minutes?: number
  ip?: string
}) {
  if (action === 'status') return <TimerStatusCommand ip={ip} />
  return <TimerMutateCommand action={action} minutes={minutes} ip={ip} />
}

function TimerMutateCommand({
  action,
  minutes,
  ip
}: {
  action: 'set' | 'cancel'
  minutes?: number
  ip?: string
}) {
  const error = useCommand(async () => {
    const device = await resolveDevice(ip)
    if (action === 'set') {
      await device.cronAdd(minutes!)
    } else {
      await device.cronDel()
    }
    device.disconnect()
  })

  if (error) return <ErrorText message={error} />
  return null
}

function TimerStatusCommand({ ip }: { ip?: string }) {
  const { exit } = useApp()
  const [timer, setTimer] = useState<CronTimer | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    resolveDevice(ip)
      .then(async (device) => {
        const t = await device.cronGet()
        device.disconnect()
        setTimer(t)
      })
      .catch((e: Error) => {
        setError(e.message)
        process.exitCode = 1
      })
      .finally(() => exit())
  }, [])

  if (error) return <ErrorText message={error} />
  if (timer === undefined) return null
  if (timer === null)
    return (
      <Box marginTop={1}>
        <Text dimColor>No timer set</Text>
      </Box>
    )
  return (
    <Box gap={1} marginTop={1}>
      <Text>Sleep timer:</Text>
      <Text color="cyan" bold>
        {timer.delay}m
      </Text>
      <Text dimColor>remaining</Text>
    </Box>
  )
}
