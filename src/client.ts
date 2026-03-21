import * as net from 'node:net'
import type { RpcCommand, RpcResponse, YeelightDevice } from './types.js'

export class YeelightClient {
  private socket: net.Socket | null = null
  private cmdId = 1
  private pendingResolvers = new Map<number, (r: RpcResponse) => void>()
  private buffer = ''

  constructor(private readonly device: YeelightDevice) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(
        { host: this.device.ip, port: this.device.port },
        resolve
      )
      this.socket.setEncoding('utf8')
      this.socket.on('error', reject)
      this.socket.on('data', (chunk: string) => this.onData(chunk))
      this.socket.on('close', () => (this.socket = null))
    })
  }

  disconnect(): void {
    this.socket?.destroy()
    this.socket = null
  }

  send(method: string, params: RpcCommand['params']): Promise<RpcResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'))
        return
      }
      const id = this.cmdId++
      const cmd: RpcCommand = { id, method, params }
      const display = params.map((p) =>
        typeof p === 'number' && p > 255
          ? `#${p.toString(16).padStart(6, '0').toUpperCase()} (${(p >> 16) & 0xff}, ${(p >> 8) & 0xff}, ${p & 0xff})`
          : String(p)
      )
      console.log(`  → [${id}] ${method}(${display.join(', ')})`)
      this.pendingResolvers.set(id, resolve)
      this.socket.write(JSON.stringify(cmd) + '\r\n', (err) => {
        if (err) {
          this.pendingResolvers.delete(id)
          reject(err)
        }
      })
    })
  }

  // ── Both strips via set_segment_rgb(left_rgb, right_rgb) ─────────────────

  /** Set left and right strip colors independently in one command */
  setSegments(
    leftR: number,
    leftG: number,
    leftB: number,
    rightR: number,
    rightG: number,
    rightB: number
  ) {
    const left = (leftR << 16) | (leftG << 8) | leftB
    const right = (rightR << 16) | (rightG << 8) | rightB
    return this.send('set_segment_rgb', [left, right])
  }

  // ── bg_set_rgb — sets BOTH strips to same color ─────────────────────────
  setAll(
    r: number,
    g: number,
    b: number,
    effect: 'smooth' | 'sudden' = 'smooth',
    duration = 500
  ) {
    const rgb = (r << 16) | (g << 8) | b
    return this.send('bg_set_rgb', [rgb, effect, duration])
  }

  setPower(
    on: boolean,
    effect: 'smooth' | 'sudden' = 'smooth',
    duration = 500
  ) {
    return this.send('bg_set_power', [on ? 'on' : 'off', effect, duration])
  }

  setBrightness(
    brightness: number,
    effect: 'smooth' | 'sudden' = 'smooth',
    duration = 500
  ) {
    return this.send('bg_set_bright', [
      Math.max(1, Math.min(100, brightness)),
      effect,
      duration
    ])
  }

  private onData(chunk: string): void {
    this.buffer += chunk
    const lines = this.buffer.split('\r\n')
    this.buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const response = JSON.parse(line) as RpcResponse
        const resolver = this.pendingResolvers.get(response.id)
        if (resolver) {
          this.pendingResolvers.delete(response.id)
          resolver(response)
        }
      } catch {
        // notification or malformed — ignore
      }
    }
  }
}
