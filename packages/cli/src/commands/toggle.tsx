import { useCommand } from '../useCommand'
import { resolveDevice } from '../resolve'
import { ErrorText } from '../components'

export function ToggleCommand({ ip }: { ip?: string }) {
  const error = useCommand(async () => {
    const device = await resolveDevice(ip)
    await device.devToggle()
    device.disconnect()
  })

  if (error) return <ErrorText message={error} />
  return null
}
