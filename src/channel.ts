import { UnsupportedError } from './errors.js'
import type { Flow } from './flow.js'
import type { Transport } from './transport.js'
import type {
  ChannelCapabilities,
  ChannelState,
  TransitionOptions
} from './types.js'

const DEFAULT_EFFECT = 'smooth'
const DEFAULT_DURATION = 300

export class LightChannel {
  constructor(
    readonly type: 'main' | 'background',
    readonly capabilities: ChannelCapabilities,
    private readonly transport: Transport,
    private readonly prefix: string // '' for main, 'bg_' for background
  ) {}

  private transition(opts?: TransitionOptions): [string, number] {
    return [opts?.effect ?? DEFAULT_EFFECT, opts?.duration ?? DEFAULT_DURATION]
  }

  async setPower(on: boolean, opts?: TransitionOptions): Promise<void> {
    const [effect, duration] = this.transition(opts)
    await this.transport.send(`${this.prefix}set_power`, [
      on ? 'on' : 'off',
      effect,
      duration
    ])
  }

  async toggle(): Promise<void> {
    await this.transport.send(`${this.prefix}toggle`, [])
  }

  async setBrightness(value: number, opts?: TransitionOptions): Promise<void> {
    const [effect, duration] = this.transition(opts)
    const clamped = Math.max(1, Math.min(100, Math.round(value)))
    await this.transport.send(`${this.prefix}set_bright`, [
      clamped,
      effect,
      duration
    ])
  }

  async setColorTemp(kelvin: number, opts?: TransitionOptions): Promise<void> {
    if (!this.capabilities.hasColorTemp) {
      throw new UnsupportedError(
        `Channel '${this.type}' does not support color temperature`
      )
    }
    const [effect, duration] = this.transition(opts)
    await this.transport.send(`${this.prefix}set_ct_abx`, [
      Math.round(kelvin),
      effect,
      duration
    ])
  }

  async setRGB(
    r: number,
    g: number,
    b: number,
    opts?: TransitionOptions
  ): Promise<void> {
    if (!this.capabilities.hasColor) {
      throw new UnsupportedError(
        `Channel '${this.type}' does not support RGB color`
      )
    }
    const [effect, duration] = this.transition(opts)
    const rgb = ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)
    await this.transport.send(`${this.prefix}set_rgb`, [rgb, effect, duration])
  }

  async setHSV(
    hue: number,
    saturation: number,
    opts?: TransitionOptions
  ): Promise<void> {
    if (!this.capabilities.hasColor) {
      throw new UnsupportedError(
        `Channel '${this.type}' does not support color`
      )
    }
    const [effect, duration] = this.transition(opts)
    await this.transport.send(`${this.prefix}set_hsv`, [
      Math.max(0, Math.min(359, Math.round(hue))),
      Math.max(0, Math.min(100, Math.round(saturation))),
      effect,
      duration
    ])
  }

  async startFlow(flow: Flow): Promise<void> {
    if (!this.capabilities.hasFlow) {
      throw new UnsupportedError(
        `Channel '${this.type}' does not support color flow`
      )
    }
    const { count, action, expression } = flow.toParams()
    await this.transport.send(`${this.prefix}start_cf`, [
      count,
      action,
      expression
    ])
  }

  async stopFlow(): Promise<void> {
    await this.transport.send(`${this.prefix}stop_cf`, [])
  }

  async getState(): Promise<ChannelState> {
    const props =
      this.prefix === ''
        ? ['power', 'bright', 'ct', 'rgb', 'color_mode', 'flowing']
        : [
            'bg_power',
            'bg_bright',
            'bg_ct',
            'bg_rgb',
            'bg_color_mode',
            'bg_flowing'
          ]

    const [power, bright, ct, rgb, colorMode, flowing] =
      await this.transport.send('get_prop', props)

    let rgbTuple: [number, number, number] | null = null
    if (this.capabilities.hasColor && colorMode === '1' && rgb) {
      const v = parseInt(rgb, 10)
      if (!isNaN(v)) {
        rgbTuple = [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
      }
    }

    return {
      power: power === 'on',
      brightness: parseInt(bright, 10) || 0,
      colorTemp:
        this.capabilities.hasColorTemp && colorMode === '2' && ct
          ? parseInt(ct, 10) || null
          : null,
      rgb: rgbTuple,
      flowing: flowing === '1'
    }
  }
}
