import { useCommand } from '../useCommand'
import { resolveDevice } from '../resolve'
import { ErrorText } from '../components'

type AdjustProp = 'brightness' | 'ct' | 'color'

export function AdjustCommand({
  prop,
  percentage,
  ip,
  bg,
  duration
}: {
  prop: AdjustProp
  percentage?: number
  ip?: string
  bg?: boolean
  duration: number
}) {
  const error = useCommand(async () => {
    const device = await resolveDevice(ip)
    const ch = bg ? device.background : device.main
    if (!ch) throw new Error('This device has no background channel')
    const dur = duration || undefined
    if (prop === 'brightness') await ch.adjustBrightness(percentage!, dur)
    else if (prop === 'ct') await ch.adjustColorTemp(percentage!, dur)
    else await ch.adjustColor(dur)
    device.disconnect()
  })

  if (error) return <ErrorText message={error} />
  return null
}
