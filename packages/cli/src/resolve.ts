import { YeelightDevice } from 'yeelight-client'

export async function resolveDevice(
  ip?: string,
  opts?: { timeout?: number; withMeta?: boolean }
): Promise<YeelightDevice> {
  if (ip) {
    // withMeta: true — run SSDP to resolve model/name/support (e.g. status command)
    // default (fast path) — skip discovery, just TCP + command
    return YeelightDevice.connect(ip, undefined, { discover: opts?.withMeta === true ? undefined : false })
  }

  const devices = await YeelightDevice.discover({
    timeout: opts?.timeout ?? 3000
  })

  if (devices.length === 0) {
    throw new Error('No devices found. Make sure LAN Control is enabled.')
  }

  if (devices.length > 1) {
    const list = devices
      .map((d) => `  ${d.ip}  ${d.name} (${d.model})`)
      .join('\n')
    throw new Error(`Multiple devices found. Specify one with --ip:\n${list}`)
  }

  await devices[0].connect()
  return devices[0]
}
