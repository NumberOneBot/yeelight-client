import * as dgram from 'node:dgram'
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

export function discover(timeoutMs = SSDP_TIMEOUT_MS): Promise<DeviceInfo[]> {
  return new Promise((resolve, reject) => {
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
      socket.send(buf, 0, buf.length, SSDP_PORT, SSDP_ADDRESS, (err) => {
        if (err) reject(err)
      })

      setTimeout(() => {
        socket.close()
        resolve(devices)
      }, timeoutMs)
    })
  })
}
