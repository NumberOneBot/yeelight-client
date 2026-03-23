import { EventEmitter } from 'node:events'
import {
  capabilitiesFromProbe,
  capabilitiesFromSupport
} from './capabilities.js'
import type { Capabilities } from './capabilities.js'
import { LightChannel } from './channel.js'
import { UnsupportedError } from './errors.js'
import { discover as ssdpDiscover } from './discovery.js'
import type { Flow } from './flow.js'
import { Transport } from './transport.js'
import type { ChannelState } from './types.js'

export type SceneConfig =
  | { type: 'color'; rgb: [number, number, number]; brightness: number }
  | { type: 'hsv'; hue: number; saturation: number; brightness: number }
  | { type: 'ct'; colorTemp: number; brightness: number }
  | { type: 'cf'; flow: Flow }
  | { type: 'auto_delay_off'; brightness: number; minutes: number }

const DEFAULT_PORT = 55443
const PROBE_PROPS = ['ct', 'rgb', 'bg_power', 'bg_ct', 'bg_rgb']

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
   * Connects directly to a device by IP without discovery. Probes capabilities
   * via get_prop.
   */
  static async connect(
    ip: string,
    port = DEFAULT_PORT
  ): Promise<YeelightDevice> {
    const transport = new Transport()
    await transport.connect(ip, port)
    const probeResult = await transport.send('get_prop', PROBE_PROPS)
    const caps = capabilitiesFromProbe(probeResult)
    return new YeelightDevice({
      id: '',
      ip,
      port,
      model: 'unknown',
      name: '',
      capabilities: caps,
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
   * Throws UnsupportedError on devices without segment control.
   */
  async setSegments(
    left: [number, number, number],
    right: [number, number, number]
  ): Promise<void> {
    if (!this.capabilities.hasSegments) {
      throw new UnsupportedError(
        `Device '${this.model}' does not support segment control`
      )
    }
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
   * Applies to the main channel only — no background variant in the protocol.
   */
  async setScene(scene: SceneConfig): Promise<void> {
    let params: (string | number)[]
    switch (scene.type) {
      case 'color': {
        if (!this.capabilities.main.hasColor) {
          throw new UnsupportedError(
            `Device '${this.model}' does not support RGB color`
          )
        }
        const [r, g, b] = scene.rgb
        const v = ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)
        params = ['color', v, Math.max(1, Math.min(100, scene.brightness))]
        break
      }
      case 'hsv': {
        if (!this.capabilities.main.hasColor) {
          throw new UnsupportedError(
            `Device '${this.model}' does not support color`
          )
        }
        params = [
          'hsv',
          Math.max(0, Math.min(359, Math.round(scene.hue))),
          Math.max(0, Math.min(100, Math.round(scene.saturation))),
          Math.max(1, Math.min(100, Math.round(scene.brightness)))
        ]
        break
      }
      case 'ct': {
        if (!this.capabilities.main.hasColorTemp) {
          throw new UnsupportedError(
            `Device '${this.model}' does not support color temperature`
          )
        }
        params = [
          'ct',
          Math.round(scene.colorTemp),
          Math.max(1, Math.min(100, Math.round(scene.brightness)))
        ]
        break
      }
      case 'cf': {
        if (!this.capabilities.main.hasFlow) {
          throw new UnsupportedError(
            `Device '${this.model}' does not support color flow`
          )
        }
        const { count, action, expression } = scene.flow.toParams()
        params = ['cf', count, action, expression]
        break
      }
      case 'auto_delay_off':
        params = [
          'auto_delay_off',
          Math.max(1, Math.min(100, Math.round(scene.brightness))),
          Math.round(scene.minutes)
        ]
        break
    }
    await this.transport.send('set_scene', params)
  }

  /** Saves the device name to persistent memory on the device. */
  async setName(name: string): Promise<void> {
    await this.transport.send('set_name', [name])
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
