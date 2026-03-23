import React from 'react'
import { useOneShot } from '../useOneShot'
import { resolveDevice } from '../resolve'
import { ErrorText } from '../components/ErrorText'
import { parseHex } from '../utils/color'

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
  const error = useOneShot(async () => {
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
  })

  if (error) return <ErrorText message={error} />
  return null
}
