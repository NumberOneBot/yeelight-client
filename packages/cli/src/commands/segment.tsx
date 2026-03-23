import React from 'react'
import { useCommand } from '../useCommand'
import { resolveDevice } from '../resolve'
import { ErrorText } from '../components/ErrorText'
import { parseHex } from '../utils/color'

export function SegmentCommand({
  left,
  right,
  ip
}: {
  left: string
  right: string
  ip?: string
}) {
  const error = useCommand(async () => {
    if (!left || !right) {
      throw new Error('Usage: ylc segment <#left> <#right>')
    }
    const lc = parseHex(left)
    const rc = parseHex(right)
    if (!lc) throw new Error(`Invalid left color: ${left}`)
    if (!rc) throw new Error(`Invalid right color: ${right}`)

    const device = await resolveDevice(ip)
    await device.setSegments([lc.r, lc.g, lc.b], [rc.r, rc.g, rc.b])
    device.disconnect()
  })

  if (error) return <ErrorText message={error} />
  return null
}
