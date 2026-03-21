export interface YeelightDevice {
  id: string
  ip: string
  port: number
  name: string
  model: string
  power: string
  rgb: number
  support: string[]
}

export interface RpcCommand {
  id: number
  method: string
  params: (string | number)[]
}

export type RpcResponse = {
  id: number
  result?: string[]
  error?: { code: number; message: string }
}
