interface FlowFrame {
  duration: number
  mode: 1 | 2 | 7 // 1 = RGB, 2 = CT, 7 = sleep
  value: number // rgb_int or Kelvin; ignored for sleep
  brightness: number // 1–100; 0 = no change
}

type FlowAction = 'recover' | 'stay' | 'off'

function toActionCode(action: FlowAction): 0 | 1 | 2 {
  return action === 'recover' ? 0 : action === 'stay' ? 1 : 2
}

function rgbInt(r: number, g: number, b: number): number {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)
}

// Module-internal factory — Flow constructor is not exported
function makeFlow(frames: FlowFrame[], count: number, action: 0 | 1 | 2): Flow {
  return new Flow(frames, count, action)
}

export class Flow {
  /** @internal */
  constructor(
    private readonly frames: FlowFrame[],
    private readonly count: number,
    private readonly action: 0 | 1 | 2
  ) {}

  /** Serialise to start_cf / bg_start_cf parameters */
  toParams(): { count: number; action: number; expression: string } {
    const expression = this.frames
      .map((f) => `${f.duration},${f.mode},${f.value},${f.brightness}`)
      .join(',')
    return { count: this.count, action: this.action, expression }
  }

  static builder(): FlowBuilder {
    return new FlowBuilder()
  }

  // ── Presets ──────────────────────────────────────────────────────────────

  static pulse(
    r: number,
    g: number,
    b: number,
    opts?: { count?: number; duration?: number }
  ): Flow {
    const duration = opts?.duration ?? 500
    const count = opts?.count ?? 3
    const rgb = rgbInt(r, g, b)
    return makeFlow(
      [
        { duration, mode: 1, value: rgb, brightness: 100 },
        { duration, mode: 1, value: rgb, brightness: 1 }
      ],
      count,
      0
    )
  }

  static strobe(
    r: number,
    g: number,
    b: number,
    opts?: { count?: number }
  ): Flow {
    const count = opts?.count ?? 10
    const rgb = rgbInt(r, g, b)
    return makeFlow(
      [
        { duration: 50, mode: 1, value: rgb, brightness: 100 },
        { duration: 50, mode: 1, value: rgbInt(255, 255, 255), brightness: 1 }
      ],
      count,
      0
    )
  }

  static colorCycle(opts?: { duration?: number }): Flow {
    const d = opts?.duration ?? 1000
    const colors: [number, number, number][] = [
      [255, 0, 0],
      [255, 165, 0],
      [255, 255, 0],
      [0, 255, 0],
      [0, 0, 255],
      [75, 0, 130],
      [238, 130, 238]
    ]
    const frames = colors.map(([r, g, b]) => ({
      duration: d,
      mode: 1 as const,
      value: rgbInt(r, g, b),
      brightness: 100
    }))
    return makeFlow(frames, 0, 1)
  }

  static candle(): Flow {
    const frames: FlowFrame[] = [
      { duration: 100, mode: 2, value: 1700, brightness: 80 },
      { duration: 80, mode: 2, value: 1900, brightness: 60 },
      { duration: 120, mode: 2, value: 1700, brightness: 90 },
      { duration: 100, mode: 2, value: 1800, brightness: 50 },
      { duration: 80, mode: 2, value: 1700, brightness: 75 }
    ]
    return makeFlow(frames, 0, 1)
  }

  static sunrise(durationMs: number): Flow {
    const step = Math.round(durationMs / 6)
    const frames: FlowFrame[] = [
      { duration: step, mode: 2, value: 1700, brightness: 1 },
      { duration: step, mode: 2, value: 2200, brightness: 10 },
      { duration: step, mode: 2, value: 2700, brightness: 25 },
      { duration: step, mode: 2, value: 3500, brightness: 50 },
      { duration: step, mode: 2, value: 4500, brightness: 75 },
      { duration: step, mode: 2, value: 5500, brightness: 100 }
    ]
    return makeFlow(frames, 1, 1)
  }
}

export class FlowBuilder {
  private frames: FlowFrame[] = []
  private _count = 1
  private _action: 0 | 1 | 2 = 0

  repeat(count: number): this {
    this._count = count
    return this
  }

  onEnd(action: FlowAction): this {
    this._action = toActionCode(action)
    return this
  }

  rgb(
    r: number,
    g: number,
    b: number,
    opts: { duration: number; brightness?: number }
  ): this {
    this.frames.push({
      duration: opts.duration,
      mode: 1,
      value: rgbInt(r, g, b),
      brightness: opts.brightness ?? 100
    })
    return this
  }

  colorTemp(
    kelvin: number,
    opts: { duration: number; brightness?: number }
  ): this {
    this.frames.push({
      duration: opts.duration,
      mode: 2,
      value: kelvin,
      brightness: opts.brightness ?? 100
    })
    return this
  }

  sleep(ms: number): this {
    this.frames.push({ duration: ms, mode: 7, value: 0, brightness: 0 })
    return this
  }

  build(): Flow {
    if (this.frames.length === 0)
      throw new Error('FlowBuilder: no frames added')
    return makeFlow([...this.frames], this._count, this._action)
  }
}
