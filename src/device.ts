import { EventEmitter } from 'node:events'
import {
  capabilitiesFromProps,
  capabilitiesFromSupport,
  fullCapabilities
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
// See channel.ts CT_MAX — same threshold for push-event parsing
const CT_MAX = 10000

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
    this.transport.on('props', (params: unknown) => {
      const raw = params as Record<string, string>
      this.emit('props', {
        main: this.parseMainProps(raw),
        bg: this.background ? this.parseBgProps(raw) : null
      })
    })
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
    signal?: AbortSignal
  }): Promise<YeelightDevice[]> {
    const infos = await ssdpDiscover(opts?.timeout, opts?.signal)
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
  static async scan(signal?: AbortSignal): Promise<YeelightDevice[]> {
    const infos = await tcpScan(signal)
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
   *
   * By default, tries unicast SSDP first to resolve model + capabilities;
   * falls back to get_prop probe if SSDP times out.
   *
   * Pass `{ capabilities }` to use pre-known capabilities (e.g. from a prior
   * scan) — skips all discovery, uses exactly the provided capabilities.
   *
   * Pass `{ discover: false }` to skip all discovery — just TCP handshake.
   * Use this when the caller already knows what commands the device supports
   * (e.g. single-shot CLI control commands). Assumes full capabilities.
   */
  static async connect(
    ip: string,
    port = DEFAULT_PORT,
    opts?: { discover?: boolean; capabilities?: Capabilities }
  ): Promise<YeelightDevice> {
    const transport = new Transport()
    await transport.connect(ip, port)

    if (opts?.capabilities) {
      return new YeelightDevice({
        id: '',
        ip,
        port,
        model: 'unknown',
        name: '',
        capabilities: opts.capabilities,
        transport
      })
    }

    if (opts?.discover === false) {
      return new YeelightDevice({
        id: '',
        ip,
        port,
        model: 'unknown',
        name: '',
        capabilities: fullCapabilities(),
        transport
      })
    }

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

  /**
   * Fetches the current state of all channels in a single `get_prop` request.
   * Preferred over calling `device.main.getState()` + `device.background.getState()`
   * separately — avoids the extra round-trip.
   */
  async getState(): Promise<{ main: ChannelState; bg: ChannelState | null }> {
    const mainProps = [
      'main_power',
      'power',
      'bright',
      'ct',
      'rgb',
      'color_mode',
      'flowing',
      'min_ct',
      'max_ct'
    ]
    const bgProps = this.background
      ? [
          'bg_power',
          'bg_bright',
          'bg_ct',
          'bg_rgb',
          'bg_color_mode',
          'bg_lmode',
          'bg_flowing',
          'bg_min_ct',
          'bg_max_ct'
        ]
      : []
    const allProps = [...mainProps, ...bgProps]
    const values = await this.transport.send('get_prop', allProps)
    const raw = Object.fromEntries(allProps.map((p, i) => [p, values[i] ?? '']))

    const mainPartial = this.parseMainProps(raw)
    const ctMin = parseInt(raw.min_ct, 10)
    const ctMax = parseInt(raw.max_ct, 10)
    const main: ChannelState = {
      power: mainPartial.power ?? false,
      brightness: mainPartial.brightness ?? 0,
      colorTemp: mainPartial.colorTemp ?? null,
      ctRange:
        this.main.capabilities.hasColorTemp && ctMin > 0 && ctMax > 0
          ? [ctMin, ctMax]
          : null,
      rgb: mainPartial.rgb ?? null,
      colorMode: mainPartial.colorMode ?? null,
      flowing: mainPartial.flowing ?? false
    }

    if (!this.background) return { main, bg: null }

    const bgPartial = this.parseBgProps(raw)
    const bgCtMin = parseInt(raw.bg_min_ct, 10)
    const bgCtMax = parseInt(raw.bg_max_ct, 10)
    const bg: ChannelState = {
      power: bgPartial.power ?? false,
      brightness: bgPartial.brightness ?? 0,
      colorTemp: bgPartial.colorTemp ?? null,
      ctRange:
        this.background.capabilities.hasColorTemp && bgCtMin > 0 && bgCtMax > 0
          ? [bgCtMin, bgCtMax]
          : null,
      rgb: bgPartial.rgb ?? null,
      colorMode: bgPartial.colorMode ?? null,
      flowing: bgPartial.flowing ?? false
    }

    return { main, bg }
  }

  // ── EventEmitter overloads for type safety ────────────────────────────────

  private parseMainProps(raw: Record<string, string>): Partial<ChannelState> {
    const result: Partial<ChannelState> = {}
    const caps = this.main.capabilities

    if (raw.main_power) result.power = raw.main_power === 'on'
    else if (raw.power !== undefined) result.power = raw.power === 'on'
    if ('bright' in raw) result.brightness = parseInt(raw.bright, 10) || 0
    if ('ct' in raw) {
      const v = parseInt(raw.ct, 10)
      if (v > CT_MAX && caps.hasColor) {
        result.rgb = [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
        result.colorTemp = null
      } else {
        result.colorTemp = caps.hasColorTemp && v > 0 ? v : null
      }
    }
    if ('rgb' in raw) {
      const v = parseInt(raw.rgb, 10)
      result.rgb =
        caps.hasColor && !isNaN(v) && v > 0
          ? [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
          : null
    }
    if ('color_mode' in raw) {
      const v = parseInt(raw.color_mode, 10)
      result.colorMode = v === 1 || v === 2 || v === 3 ? v : null
    }
    if ('flowing' in raw) result.flowing = raw.flowing === '1'

    return result
  }

  private parseBgProps(raw: Record<string, string>): Partial<ChannelState> {
    const result: Partial<ChannelState> = {}
    const caps = this.background!.capabilities

    if ('bg_power' in raw) result.power = raw.bg_power === 'on'
    if ('bg_bright' in raw) result.brightness = parseInt(raw.bg_bright, 10) || 0
    if ('bg_ct' in raw) {
      const v = parseInt(raw.bg_ct, 10)
      if (v > CT_MAX && caps.hasColor) {
        result.rgb = [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
        result.colorTemp = null
      } else {
        result.colorTemp = caps.hasColorTemp && v > 0 ? v : null
      }
    }
    if ('bg_rgb' in raw) {
      const v = parseInt(raw.bg_rgb, 10)
      result.rgb =
        caps.hasColor && !isNaN(v) && v > 0
          ? [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
          : null
    }
    if ('bg_color_mode' in raw || 'bg_lmode' in raw) {
      const v = parseInt(raw.bg_color_mode || raw.bg_lmode, 10)
      result.colorMode = v === 1 || v === 2 || v === 3 ? v : null
    }
    if ('bg_flowing' in raw) result.flowing = raw.bg_flowing === '1'

    return result
  }

  on(
    event: 'props',
    listener: (props: {
      main: Partial<ChannelState>
      bg: Partial<ChannelState> | null
    }) => void
  ): this
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
