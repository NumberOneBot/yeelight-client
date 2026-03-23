import { YeelightDevice } from 'yeelight-client'

export async function resolveDevice(
  ip?: string,
  opts?: { withSupport?: boolean; timeout?: number }
): Promise<YeelightDevice> {
  if (ip) {
    if (opts?.withSupport) {
      // Run TCP connect and SSDP discovery in parallel.
      // TCP gives a live connection fast; SSDP gives the support list.
      const [tcpResult, ssdpResult] = await Promise.allSettled([
        YeelightDevice.connect(ip),
        YeelightDevice.discover({ timeout: opts.timeout ?? 1000 }).then(
          (devs) => devs.find((d) => d.ip === ip) ?? null
        )
      ])

      if (tcpResult.status === 'rejected') {
        throw new Error(tcpResult.reason?.message ?? `Cannot connect to ${ip}`)
      }

      const tcpDevice = tcpResult.value
      const ssdpDevice =
        ssdpResult.status === 'fulfilled' ? ssdpResult.value : null

      // Prefer SSDP device — only SSDP discovery populates the
      // support list (supported commands). TCP alone doesn't have it.
      if (ssdpDevice) {
        tcpDevice.disconnect()
        await ssdpDevice.connect()
        return ssdpDevice
      }
      return tcpDevice
    }

    return YeelightDevice.connect(ip)
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
