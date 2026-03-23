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
