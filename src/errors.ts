export class UnsupportedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedError'
  }
}

export class ConnectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConnectionError'
  }
}

export class DeviceError extends Error {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'DeviceError'
    this.code = code
  }
}
