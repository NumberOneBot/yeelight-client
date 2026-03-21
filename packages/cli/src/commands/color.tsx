import React, { useEffect, useState } from 'react'
import { Text, useApp } from 'ink'
import { resolveDevice } from '../resolve'

function parseHex(
  input: string
): { r: number; g: number; b: number; a: number | null } | null {
  if (!input.startsWith('#')) return null
  const raw = input.slice(1)
  if (!/^[0-9a-fA-F]+$/.test(raw)) return null

  let r: number,
    g: number,
    b: number,
    a: number | null = null

  if (raw.length === 3 || raw.length === 4) {
    r = parseInt(raw[0] + raw[0], 16)
    g = parseInt(raw[1] + raw[1], 16)
    b = parseInt(raw[2] + raw[2], 16)
    if (raw.length === 4) a = parseInt(raw[3] + raw[3], 16)
  } else if (raw.length === 6 || raw.length === 8) {
    r = parseInt(raw.slice(0, 2), 16)
    g = parseInt(raw.slice(2, 4), 16)
    b = parseInt(raw.slice(4, 6), 16)
    if (raw.length === 8) a = parseInt(raw.slice(6, 8), 16)
  } else {
    return null
  }

  return { r, g, b, a }
}

export function ColorCommand({
  raw,
  ip,
  bg,
  duration
}: {
  raw: string[]
  ip?: string
  bg?: boolean
  duration: number
}) {
  const { exit } = useApp()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        let rv: number, gv: number, bv: number
        let brightness: number | null = null

        if (raw[0]?.startsWith('#')) {
          const parsed = parseHex(raw[0])
          if (!parsed) {
            throw new Error(
              'Invalid hex color. Use #RRGGBB, #RGB, #RRGGBBAA, or #RGBA'
            )
          }
          ;({ r: rv, g: gv, b: bv } = parsed)
          if (parsed.a !== null) {
            brightness = Math.max(1, Math.round((parsed.a / 255) * 100))
          }
        } else {
          rv = Number(raw[0])
          gv = Number(raw[1])
          bv = Number(raw[2])
          if ([rv, gv, bv].some((v) => isNaN(v) || v < 0 || v > 255)) {
            throw new Error(
              'Provide #hex or three 0–255 values: ylc color <r> <g> <b>'
            )
          }
        }

        const device = await resolveDevice(ip)
        const ch = bg ? device.background : device.main
        if (!ch) throw new Error('This device has no background channel')
        await ch.setRGB(rv!, gv!, bv!, { duration })
        if (brightness !== null)
          await ch.setBrightness(brightness, { duration })
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
