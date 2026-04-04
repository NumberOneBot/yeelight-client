import * as dgram from 'node:dgram'
import * as net from 'node:net'
import * as os from 'node:os'
import type { DeviceInfo } from './types.js'

const SSDP_ADDRESS = '239.255.255.250'
const SSDP_PORT = 1982
const SSDP_TIMEOUT_MS = 3000

const SEARCH_MESSAGE = [
  'M-SEARCH * HTTP/1.1',
  `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`,
  'MAN: "ssdp:discover"',
  'ST: wifi_bulb',
  'MX: 1',
  '',
  ''
].join('\r\n')

function parseDeviceHeaders(raw: string): DeviceInfo | null {
  const lines = raw.split('\r\n')
  const get = (key: string) =>
    lines
      .find((l) => l.toLowerCase().startsWith(key.toLowerCase()))
      ?.split(': ')[1]
      ?.trim() ?? ''

  const location = get('Location')
  const match = location.match(/yeelight:\/\/([\d.]+):(\d+)/)
  if (!match) return null

  return {
    id: get('id'),
    ip: match[1],
    port: Number(match[2]),
    name: get('name'),
    model: get('model'),
    power: get('power'),
    rgb: Number(get('rgb')),
    support: get('support').split(' ').filter(Boolean)
  }
}

function physicalInterfaces(): string[] {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(
      (iface): iface is os.NetworkInterfaceInfo =>
        !!iface && iface.family === 'IPv4' && !iface.internal
    )
    .map((iface) => iface.address)
}

export function discover(
  timeoutMs = SSDP_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<DeviceInfo[]> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      resolve([])
      return
    }
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    const devices: DeviceInfo[] = []
    const seen = new Set<string>()

    socket.on('error', reject)

    socket.on('message', (msg) => {
      const text = msg.toString('utf8')
      const device = parseDeviceHeaders(text)
      if (device && !seen.has(device.id || device.ip)) {
        seen.add(device.id || device.ip)
        devices.push(device)
      }
    })

    socket.bind(() => {
      const buf = Buffer.from(SEARCH_MESSAGE)

      // Send M-SEARCH through every physical interface so the correct
      // one reaches the lamp regardless of OS multicast routing.
      const addresses = physicalInterfaces()
      if (addresses.length === 0) addresses.push('0.0.0.0')

      for (const addr of addresses) {
        try {
          socket.setMulticastInterface(addr)
          socket.send(buf, 0, buf.length, SSDP_PORT, SSDP_ADDRESS)
        } catch {
          // interface doesn't support multicast — skip
        }
      }

      setTimeout(() => {
        socket.close()
        resolve(devices)
      }, timeoutMs)

      signal?.addEventListener(
        'abort',
        () => {
          socket.close()
          resolve(devices)
        },
        { once: true }
      )
    })
  })
}

/**
 * Sends a unicast SSDP M-SEARCH to a specific device IP and returns its
 * DeviceInfo (model, name, id, support, etc.) or null on timeout.
 */
export function discoverOne(
  ip: string,
  timeoutMs = 1500
): Promise<DeviceInfo | null> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    let done = false

    const finish = (result: DeviceInfo | null) => {
      if (done) return
      done = true
      clearTimeout(timer)
      try {
        socket.close()
      } catch {
        /* already closed */
      }
      resolve(result)
    }

    const timer = setTimeout(() => finish(null), timeoutMs)

    socket.on('error', () => finish(null))
    socket.on('message', (msg: Buffer) => {
      const device = parseDeviceHeaders(msg.toString('utf8'))
      if (device) finish(device)
    })

    socket.bind(() => {
      const buf = Buffer.from(SEARCH_MESSAGE)
      socket.send(buf, 0, buf.length, SSDP_PORT, ip, (err: Error | null) => {
        if (err) finish(null)
      })
    })
  })
}

// ---------------------------------------------------------------------------
// TCP scan — finds Yeelight devices that don't respond to SSDP
// ---------------------------------------------------------------------------

const YEELIGHT_PORT = 55443
const CONNECT_TIMEOUT_MS = 1000
const RESPONSE_TIMEOUT_MS = 1500
const SCAN_CONCURRENCY = 20

const PROBE_MESSAGE =
  JSON.stringify({
    id: 1,
    method: 'get_prop',
    params: ['power', 'ct', 'rgb', 'name', 'bg_power']
  }) + '\r\n'

function subnetHosts(address: string): string[] {
  const parts = address.split('.')
  const base = parts.slice(0, 3).join('.')
  const own = Number(parts[3])
  const hosts: string[] = []
  for (let i = 1; i <= 254; i++) {
    if (i !== own) hosts.push(`${base}.${i}`)
  }
  return hosts
}

function probeHost(ip: string): Promise<DeviceInfo | null> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: ip, port: YEELIGHT_PORT })
    let settled = false

    const done = (result: DeviceInfo | null) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    socket.setTimeout(CONNECT_TIMEOUT_MS)
    socket.once('timeout', () => done(null))
    socket.once('error', () => done(null))

    socket.once('connect', () => {
      // Device is a Yeelight — try SSDP first for full metadata (model, support[]).
      // Fall back to get_prop probe only if SSDP times out.
      discoverOne(ip, RESPONSE_TIMEOUT_MS).then((info) => {
        if (info) {
          done(info)
          return
        }

        // SSDP timed out — fall back to get_prop on the open TCP connection
        socket.setTimeout(RESPONSE_TIMEOUT_MS)
        socket.write(PROBE_MESSAGE)
      })
    })

    let buf = ''
    socket.on('data', (chunk: Buffer) => {
      buf += chunk.toString('utf8')
      let nl: number
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).trimEnd()
        buf = buf.slice(nl + 1)
        try {
          const resp = JSON.parse(line) as { id?: number; result?: string[] }
          // Skip unsolicited notifications (no id or no result)
          if (resp.id !== 1 || !Array.isArray(resp.result)) continue
          const [power, ct, rgbStr, name, bgPower] = resp.result
          // Derive synthetic support entries from prop values.
          // 'support' is an SSDP-only field — not queryable via get_prop.
          const support: string[] = []
          if (ct) support.push('set_ct_abx')
          if (rgbStr && rgbStr !== '0') support.push('set_rgb', 'set_hsv')
          if (bgPower)
            support.push('bg_set_power', 'bg_set_rgb', 'bg_set_ct_abx')
          done({
            id: '',
            ip,
            port: YEELIGHT_PORT,
            name: name ?? '',
            model: '',
            power: power ?? '',
            rgb: Number(rgbStr) || 0,
            support
          })
        } catch {
          // non-JSON line — skip
        }
      }
    })
  })
}

export async function scan(signal?: AbortSignal): Promise<DeviceInfo[]> {
  const allHosts = [
    ...new Set(
      Object.values(os.networkInterfaces())
        .flat()
        .filter(
          (iface): iface is os.NetworkInterfaceInfo =>
            !!iface && iface.family === 'IPv4' && !iface.internal
        )
        .flatMap((iface) => subnetHosts(iface.address))
    )
  ]

  const devices: DeviceInfo[] = []
  let i = 0
  await Promise.all(
    Array.from({ length: SCAN_CONCURRENCY }, async () => {
      while (i < allHosts.length) {
        if (signal?.aborted) return
        const ip = allHosts[i++]
        const device = await probeHost(ip)
        if (device) devices.push(device)
      }
    })
  )
  return devices
}
