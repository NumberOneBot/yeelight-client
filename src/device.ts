import { EventEmitter } from 'node:events'
import {
  capabilitiesFromProps,
  capabilitiesFromSupport
} from './capabilities.js'
import type { Capabilities } from './capabilities.js'
import { LightChannel } from './channel.js'
import { UnsupportedError } from './errors.js'
import {
  discover as ssdpDiscover,
  discoverOne,
  scan as tcpScan
} from './discovery.js'
import { Transport } from './transport.js'
import type { ChannelState, CronTimer, SceneConfig } from './types.js'

export type { SceneConfig } from './types.js'

const DEFAULT_PORT = 55443
const GET_PROPS = ['ct', 'rgb', 'bg_power', 'bg_ct', 'bg_rgb']

export class YeelightDevice extends EventEmitter {
  private readonly transport: Transport
  private readonly port: number

  readonly id: string
  readonly ip: string
  readonly model: string
  readonly name: string
  readonly support: string[]
  readonly capabilities: Capabilities
  readonly main: LightChannel
  readonly background: LightChannel | null

  private constructor(opts: {
    id: string
    ip: string
    port: number
    model: string
    name: string
    support?: string[]
    capabilities: Capabilities
    transport: Transport
  }) {
    super()
    this.transport = opts.transport
    this.port = opts.port
    this.id = opts.id
    this.ip = opts.ip
    this.model = opts.model ?? 'unknown'
    this.name = opts.name ?? ''
    this.support = opts.support ?? []
    this.capabilities = opts.capabilities
    this.main = new LightChannel(
      'main',
      opts.capabilities.main,
      opts.transport,
      ''
    )
    this.background = opts.capabilities.background
      ? new LightChannel(
          'background',
          opts.capabilities.background,
          opts.transport,
          'bg_'
        )
      : null

    this.transport.on('disconnect', () => this.emit('disconnect'))
    this.transport.on('props', (params: unknown) => this.emit('props', params))
    this.transport.on('tx', (frame: string) => this.emit('tx', frame))
    this.transport.on('rx', (frame: string) => this.emit('rx', frame))
  }

  // ── Static factory methods ────────────────────────────────────────────────

  /**
   * Discovers devices on the LAN via SSDP multicast.
   * Returns device objects populated from SSDP data — NOT yet connected.
   * Call device.connect() before sending any commands.
   */
  static async discover(opts?: {
    timeout?: number
  }): Promise<YeelightDevice[]> {
    const infos = await ssdpDiscover(opts?.timeout)
    return infos.map((info) => {
      // capabilitiesFromSupport expects support: string[]
      const caps = capabilitiesFromSupport(info.support)
      const transport = new Transport()
      return new YeelightDevice({
        ...info,
        capabilities: caps,
        transport
      })
    })
  }

  /**
   * Scans the local subnet via TCP and returns found devices (not yet connected).
   * Use when SSDP multicast is blocked or unreliable on the network.
   * Call device.connect() before sending any commands.
   */
  static async scan(): Promise<YeelightDevice[]> {
    const infos = await tcpScan()
    return infos.map((info) => {
      const transport = new Transport()
      return new YeelightDevice({
        ...info,
        capabilities: capabilitiesFromSupport(info.support),
        transport
      })
    })
  }

  /**
   * Connects directly to a device by IP without discovery.
   * Tries unicast SSDP first (gives model + full support list for capabilities).
   * Falls back to get_prop probe only if SSDP times out.
   */
  static async connect(
    ip: string,
    port = DEFAULT_PORT
  ): Promise<YeelightDevice> {
    const transport = new Transport()
    await transport.connect(ip, port)

    const info = await discoverOne(ip)
    if (info) {
      return new YeelightDevice({
        ...info,
        port,
        capabilities: capabilitiesFromSupport(info.support),
        transport
      })
    }

    const probeResult = await transport.send('get_prop', GET_PROPS)
    return new YeelightDevice({
      id: '',
      ip,
      port,
      model: 'unknown',
      name: '',
      capabilities: capabilitiesFromProps(probeResult),
      transport
    })
  }

  // ── Instance methods ───────────────────────────────────────────────────────

  /**
   * Connects (or reconnects) to the device. No-op if already connected.
   * Typically only needed for devices returned by discover() after a reconnect.
   */
  async connect(): Promise<void> {
    if (this.transport.isConnected()) return
    await this.transport.connect(this.ip, this.port)
  }

  disconnect(): void {
    this.transport.disconnect()
  }

  isConnected(): boolean {
    return this.transport.isConnected()
  }

  /**
   * Set left and right strip colors independently. lamp15 only.
   */
  async setSegments(
    left: [number, number, number],
    right: [number, number, number]
  ): Promise<void> {
    const leftInt =
      ((left[0] & 0xff) << 16) | ((left[1] & 0xff) << 8) | (left[2] & 0xff)
    const rightInt =
      ((right[0] & 0xff) << 16) | ((right[1] & 0xff) << 8) | (right[2] & 0xff)
    await this.transport.send('set_segment_rgb', [leftInt, rightInt])
  }

  async getRawProps(props: string[]): Promise<Record<string, string>> {
    const values = await this.transport.send('get_prop', props)
    return Object.fromEntries(props.map((p, i) => [p, values[i] ?? '']))
  }

  /**
   * Sets the device directly to a specified state, turning it on if currently off.
   * Delegates to `device.main.setScene()`. Use `device.background.setScene()` for the background channel.
   */
  async setScene(scene: SceneConfig): Promise<void> {
    return this.main.setScene(scene)
  }

  /** Saves the device name to persistent memory on the device. */
  async setName(name: string): Promise<void> {
    await this.transport.send('set_name', [name])
  }

  /**
   * Sets a sleep timer on the device. After `minutes`, the device powers off.
   * Only one timer (type 0) is supported by the protocol.
   */
  async cronAdd(minutes: number): Promise<void> {
    await this.transport.send('cron_add', [0, Math.round(minutes)])
  }

  /** Clears the currently active sleep timer. */
  async cronDel(): Promise<void> {
    await this.transport.send('cron_del', [0])
  }

  /** Returns the active sleep timer, or `null` if none is set. */
  async cronGet(): Promise<CronTimer | null> {
    const result = (await this.transport.send(
      'cron_get',
      [0]
    )) as unknown as Array<{ delay: number }>
    return result[0] ? { delay: result[0].delay } : null
  }

  /**
   * Toggles main and background channels simultaneously with a single command.
   * Throws UnsupportedError on devices without a background channel.
   */
  async devToggle(): Promise<void> {
    if (!this.background) {
      throw new UnsupportedError(
        `Device '${this.model}' does not have a background channel`
      )
    }
    await this.transport.send('dev_toggle', [])
  }

  // ── EventEmitter overloads for type safety ────────────────────────────────

  on(event: 'props', listener: (props: Partial<ChannelState>) => void): this
  on(event: 'disconnect', listener: () => void): this
  on(event: 'tx' | 'rx', listener: (frame: string) => void): this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, listener: (...args: any[]) => void): this {
    return super.off(event, listener)
  }
}
