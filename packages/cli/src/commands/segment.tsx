import React, { useEffect, useState } from 'react'
import { Text, useApp } from 'ink'
import { resolveDevice } from '../resolve'

function parseHex(input: string): { r: number; g: number; b: number } | null {
  if (!input.startsWith('#')) return null
  const raw = input.slice(1)
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null
  if (raw.length === 3) {
    return {
      r: parseInt(raw[0] + raw[0], 16),
      g: parseInt(raw[1] + raw[1], 16),
      b: parseInt(raw[2] + raw[2], 16)
    }
  }
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16)
  }
}

export function SegmentCommand({
  left,
  right,
  ip
}: {
  left: string
  right: string
  ip?: string
}) {
  const { exit } = useApp()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        if (!left || !right) {
          throw new Error('Usage: yeelight segment <#left> <#right>')
        }
        const lc = parseHex(left)
        const rc = parseHex(right)
        if (!lc) throw new Error(`Invalid left color: ${left}`)
        if (!rc) throw new Error(`Invalid right color: ${right}`)

        const device = await resolveDevice(ip)
        await device.setSegments([lc.r, lc.g, lc.b], [rc.r, rc.g, rc.b])
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
