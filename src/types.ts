/** Raw data from SSDP discovery — internal use only */
export interface DeviceInfo {
  id: string
  ip: string
  port: number
  name: string
  model: string
  power: string
  rgb: number
  support: string[]
}

export type RpcResponse = {
  id: number
  result?: string[]
  error?: { code: number; message: string }
}

export interface TransitionOptions {
  effect?: 'smooth' | 'sudden'
  duration?: number
}

/** Power-on mode. 0 = normal, 1 = CT, 2 = RGB, 3 = HSV, 4 = color flow, 5 = night (ceiling lights only) */
export type PowerMode = 0 | 1 | 2 | 3 | 4 | 5

export interface PowerOptions extends TransitionOptions {
  mode?: PowerMode
}

export interface ChannelState {
  power: boolean
  brightness: number
  colorTemp: number | null
  rgb: [number, number, number] | null
  flowing: boolean
}

export interface ChannelCapabilities {
  hasColor: boolean
  hasColorTemp: boolean
  hasFlow: boolean
}

/** Active sleep timer returned by `cronGet()`. `delay` is remaining minutes. */
export interface CronTimer {
  delay: number
}

import type { Flow } from './flow.js'

export type SceneConfig =
  | { type: 'color'; rgb: [number, number, number]; brightness: number }
  | { type: 'hsv'; hue: number; saturation: number; brightness: number }
  | { type: 'ct'; colorTemp: number; brightness: number }
  | { type: 'cf'; flow: Flow }
  | { type: 'auto_delay_off'; brightness: number; minutes: number }
