import { YeelightDevice } from 'yeelight-client'

export async function resolveDevice(ip?: string): Promise<YeelightDevice> {
  if (ip) return YeelightDevice.connect(ip)

  const devices = await YeelightDevice.discover({ timeout: 3000 })

  if (devices.length === 0) {
    throw new Error('No devices found. Make sure LAN Control is enabled.')
  }

  if (devices.length > 1) {
    const list = devices.map((d) => `  ${d.ip}  ${d.name} (${d.model})`).join('\n')
    throw new Error(`Multiple devices found. Specify one with --ip:\n${list}`)
  }

  await devices[0].connect()
  return devices[0]
}
