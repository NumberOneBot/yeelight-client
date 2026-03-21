import { EventEmitter } from 'node:events'
import * as net from 'node:net'
import { ConnectionError, DeviceError } from './errors.js'
import type { RpcResponse } from './types.js'

const CONNECT_TIMEOUT_MS = 5000

interface Pending {
  resolve: (result: string[]) => void
  reject: (err: Error) => void
}

export class Transport extends EventEmitter {
  private socket: net.Socket | null = null
  private cmdId = 1
  private pending = new Map<number, Pending>()
  private buffer = ''

  connect(host: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port })

      socket.setTimeout(CONNECT_TIMEOUT_MS)
      socket.setEncoding('utf8')

      socket.once('connect', () => {
        socket.setTimeout(0)
        this.socket = socket
        resolve()
      })

      socket.once('error', (err) => {
        reject(new ConnectionError(err.message))
      })

      socket.once('timeout', () => {
        socket.destroy()
        reject(new ConnectionError(`Connection to ${host}:${port} timed out`))
      })

      socket.on('data', (chunk: string) => this.onData(chunk))

      socket.on('close', () => {
        this.socket = null
        this.rejectAll(new ConnectionError('Connection closed'))
        this.emit('disconnect')
      })
    })
  }

  disconnect(): void {
    this.socket?.destroy()
    this.socket = null
  }

  isConnected(): boolean {
    return this.socket !== null
  }

  send(method: string, params: (string | number)[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new ConnectionError('Not connected'))
        return
      }

      const id = this.cmdId++
      this.pending.set(id, { resolve, reject })

      this.socket.write(
        JSON.stringify({ id, method, params }) + '\r\n',
        (err) => {
          if (err) {
            this.pending.delete(id)
            reject(new ConnectionError(err.message))
          }
        }
      )
    })
  }

  private onData(chunk: string): void {
    this.buffer += chunk
    const lines = this.buffer.split('\r\n')
    this.buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const msg = JSON.parse(line) as RpcResponse & {
          method?: string
          params?: unknown
        }

        if ('id' in msg && msg.id != null) {
          const pending = this.pending.get(msg.id)
          if (pending) {
            this.pending.delete(msg.id)
            if (msg.error) {
              pending.reject(new DeviceError(msg.error.code, msg.error.message))
            } else {
              pending.resolve(msg.result ?? [])
            }
          }
        } else if (msg.method === 'props') {
          // Push notification from device (property change)
          this.emit('props', msg.params)
        }
      } catch {
        // Malformed frame — ignore
      }
    }
  }

  private rejectAll(err: Error): void {
    for (const { reject } of this.pending.values()) {
      reject(err)
    }
    this.pending.clear()
  }
}
