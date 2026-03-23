import { describe, test, expect } from 'bun:test'
import { Flow, FlowBuilder } from './flow'

describe('Flow.toParams', () => {
  test('serializes frames to expression string', () => {
    const flow = Flow.builder()
      .rgb(255, 0, 0, { duration: 500, brightness: 100 })
      .rgb(0, 255, 0, { duration: 300, brightness: 50 })
      .build()
    const { expression } = flow.toParams()

    // RGB int: 255<<16 = 16711680, 255<<8 = 65280
    expect(expression).toBe('500,1,16711680,100,300,1,65280,50')
  })

  test('count and action from builder', () => {
    const flow = Flow.builder()
      .rgb(255, 0, 0, { duration: 100 })
      .repeat(5)
      .onEnd('stay')
      .build()
    const params = flow.toParams()

    expect(params.count).toBe(5)
    expect(params.action).toBe(1) // stay = 1
  })

  test('action codes: recover=0, stay=1, off=2', () => {
    const make = (action: 'recover' | 'stay' | 'off') =>
      Flow.builder().rgb(255, 0, 0, { duration: 100 }).onEnd(action).build().toParams().action

    expect(make('recover')).toBe(0)
    expect(make('stay')).toBe(1)
    expect(make('off')).toBe(2)
  })

  test('color temp frame is mode 2', () => {
    const flow = Flow.builder()
      .colorTemp(4000, { duration: 500, brightness: 80 })
      .build()
    const { expression } = flow.toParams()

    expect(expression).toBe('500,2,4000,80')
  })

  test('sleep frame is mode 7', () => {
    const flow = Flow.builder()
      .rgb(255, 0, 0, { duration: 100 })
      .sleep(200)
      .build()
    const { expression } = flow.toParams()

    expect(expression).toContain('200,7,0,0')
  })

  test('default brightness is 100', () => {
    const flow = Flow.builder()
      .rgb(255, 0, 0, { duration: 100 })
      .build()
    const { expression } = flow.toParams()

    expect(expression).toBe('100,1,16711680,100')
  })
})

describe('Flow presets', () => {
  test('pulse — default count 3, duration 500ms, action recover', () => {
    const params = Flow.pulse(255, 0, 0).toParams()

    expect(params.count).toBe(3)
    expect(params.action).toBe(0)
    // Two frames per pulse cycle (bright + dim)
    const frames = params.expression.split(',')
    expect(frames.length).toBe(8) // 2 frames × 4 fields
    expect(frames[0]).toBe('500') // duration
  })

  test('pulse — custom count and duration', () => {
    const params = Flow.pulse(0, 255, 0, { count: 5, duration: 200 }).toParams()

    expect(params.count).toBe(5)
    const frames = params.expression.split(',')
    expect(frames[0]).toBe('200')
  })

  test('strobe — default count 10, 50ms frames', () => {
    const params = Flow.strobe(255, 0, 0).toParams()

    expect(params.count).toBe(10)
    const frames = params.expression.split(',')
    expect(frames[0]).toBe('50')
    expect(frames[4]).toBe('50')
  })

  test('colorCycle — 7 rainbow colors, infinite loop', () => {
    const params = Flow.colorCycle().toParams()

    expect(params.count).toBe(0) // infinite
    expect(params.action).toBe(1) // stay
    const frames = params.expression.split(',')
    expect(frames.length).toBe(28) // 7 colors × 4 fields
  })

  test('colorCycle — custom duration per step', () => {
    const params = Flow.colorCycle({ duration: 2000 }).toParams()
    const frames = params.expression.split(',')

    expect(frames[0]).toBe('2000')
  })

  test('candle — 5 warm frames, infinite loop', () => {
    const params = Flow.candle().toParams()

    expect(params.count).toBe(0) // infinite
    const frames = params.expression.split(',')
    expect(frames.length).toBe(20) // 5 frames × 4 fields
    // All frames mode 2 (color temp)
    for (let i = 0; i < 5; i++) {
      expect(frames[i * 4 + 1]).toBe('2')
    }
  })

  test('sunrise — 6 steps, single cycle, action stay', () => {
    const params = Flow.sunrise(6000).toParams()

    expect(params.count).toBe(1)
    expect(params.action).toBe(1) // stay
    const frames = params.expression.split(',')
    expect(frames.length).toBe(24) // 6 steps × 4 fields
    expect(frames[0]).toBe('1000') // 6000/6
  })

  test('pulse — rgb int is correct for arbitrary color', () => {
    const params = Flow.pulse(100, 200, 50).toParams()
    const expected = ((100 & 0xff) << 16) | ((200 & 0xff) << 8) | (50 & 0xff)
    const frames = params.expression.split(',')

    expect(frames[2]).toBe(String(expected))
  })
})

describe('FlowBuilder', () => {
  test('build without frames throws', () => {
    expect(() => Flow.builder().build()).toThrow('no frames added')
  })

  test('default repeat is 1', () => {
    const params = Flow.builder()
      .rgb(255, 0, 0, { duration: 100 })
      .build()
      .toParams()

    expect(params.count).toBe(1)
  })

  test('default action is recover (0)', () => {
    const params = Flow.builder()
      .rgb(255, 0, 0, { duration: 100 })
      .build()
      .toParams()

    expect(params.action).toBe(0)
  })

  test('chainable API returns same instance', () => {
    const builder = Flow.builder()
    const same = builder
      .rgb(255, 0, 0, { duration: 100 })
      .colorTemp(4000, { duration: 200 })
      .sleep(100)
      .repeat(3)
      .onEnd('off')

    expect(same).toBe(builder)
  })

  test('mixed frame types in correct order', () => {
    const params = Flow.builder()
      .rgb(255, 0, 0, { duration: 100, brightness: 80 })
      .sleep(50)
      .colorTemp(3000, { duration: 200, brightness: 60 })
      .build()
      .toParams()

    const fields = params.expression.split(',')
    // Frame 1: rgb
    expect(fields[1]).toBe('1')
    // Frame 2: sleep
    expect(fields[5]).toBe('7')
    // Frame 3: ct
    expect(fields[9]).toBe('2')
  })
})
