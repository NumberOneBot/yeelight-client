import { UnsupportedError } from './errors.js'
import type { Flow } from './flow.js'
import type { Transport } from './transport.js'
import type {
  ChannelCapabilities,
  ChannelState,
  PowerOptions,
  SceneConfig,
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

  async setPower(on: boolean, opts?: PowerOptions): Promise<void> {
    const [effect, duration] = this.transition(opts)
    const params: (string | number)[] = [on ? 'on' : 'off', effect, duration]
    if (opts?.mode !== undefined) params.push(opts.mode)
    await this.transport.send(`${this.prefix}set_power`, params)
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

  async setDefault(): Promise<void> {
    await this.transport.send(`${this.prefix}set_default`, [])
  }

  async setAdjust(
    action: 'increase' | 'decrease' | 'circle',
    prop: 'bright' | 'ct'
  ): Promise<void>
  async setAdjust(action: 'circle', prop: 'color'): Promise<void>
  async setAdjust(
    action: 'increase' | 'decrease' | 'circle',
    prop: 'bright' | 'ct' | 'color'
  ): Promise<void> {
    if (prop === 'color' && !this.capabilities.hasColor) {
      throw new UnsupportedError(
        `Channel '${this.type}' does not support color`
      )
    }
    if (prop === 'ct' && !this.capabilities.hasColorTemp) {
      throw new UnsupportedError(
        `Channel '${this.type}' does not support color temperature`
      )
    }
    await this.transport.send(`${this.prefix}set_adjust`, [action, prop])
  }

  async adjustBrightness(percentage: number, duration?: number): Promise<void> {
    const pct = Math.max(-100, Math.min(100, Math.round(percentage)))
    await this.transport.send(`${this.prefix}adjust_bright`, [
      pct,
      duration ?? 500
    ])
  }

  async adjustColorTemp(percentage: number, duration?: number): Promise<void> {
    if (!this.capabilities.hasColorTemp) {
      throw new UnsupportedError(
        `Channel '${this.type}' does not support color temperature`
      )
    }
    const pct = Math.max(-100, Math.min(100, Math.round(percentage)))
    await this.transport.send(`${this.prefix}adjust_ct`, [pct, duration ?? 500])
  }

  async adjustColor(duration?: number): Promise<void> {
    if (!this.capabilities.hasColor) {
      throw new UnsupportedError(
        `Channel '${this.type}' does not support color`
      )
    }
    await this.transport.send(`${this.prefix}adjust_color`, [duration ?? 500])
  }

  async setScene(scene: SceneConfig): Promise<void> {
    let params: (string | number)[]
    switch (scene.type) {
      case 'color': {
        if (!this.capabilities.hasColor) {
          throw new UnsupportedError(
            `Channel '${this.type}' does not support RGB color`
          )
        }
        const [r, g, b] = scene.rgb
        const v = ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)
        params = ['color', v, Math.max(1, Math.min(100, scene.brightness))]
        break
      }
      case 'hsv': {
        if (!this.capabilities.hasColor) {
          throw new UnsupportedError(
            `Channel '${this.type}' does not support color`
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
        if (!this.capabilities.hasColorTemp) {
          throw new UnsupportedError(
            `Channel '${this.type}' does not support color temperature`
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
        if (!this.capabilities.hasFlow) {
          throw new UnsupportedError(
            `Channel '${this.type}' does not support color flow`
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
    await this.transport.send(`${this.prefix}set_scene`, params)
  }

  async getState(): Promise<ChannelState> {
    const props =
      this.prefix === ''
        ? ['power', 'bright', 'ct', 'rgb', 'flowing']
        : ['bg_power', 'bg_bright', 'bg_ct', 'bg_rgb', 'bg_flowing']

    const [power, bright, ct, rgb, flowing] = await this.transport.send(
      'get_prop',
      props
    )

    let rgbTuple: [number, number, number] | null = null
    if (this.capabilities.hasColor && rgb) {
      const v = parseInt(rgb, 10)
      if (!isNaN(v) && v > 0) {
        rgbTuple = [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
      }
    }

    return {
      power: power === 'on',
      brightness: parseInt(bright, 10) || 0,
      colorTemp:
        this.capabilities.hasColorTemp && ct ? parseInt(ct, 10) || null : null,
      rgb: rgbTuple,
      flowing: flowing === '1'
    }
  }
}
