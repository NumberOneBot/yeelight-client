import { describe, test, expect } from 'bun:test'
import { capabilitiesFromSupport, capabilitiesFromProps } from './capabilities'

describe('capabilitiesFromSupport', () => {
  test('full-featured device', () => {
    const support = [
      'set_power',
      'set_bright',
      'set_ct_abx',
      'set_rgb',
      'set_hsv',
      'start_cf',
      'stop_cf',
      'set_default',
      'bg_set_power',
      'bg_set_rgb',
      'bg_set_hsv',
      'bg_set_ct_abx',
      'bg_start_cf',
      'set_segment_rgb'
    ]
    const caps = capabilitiesFromSupport(support)

    expect(caps.hasBackground).toBe(true)
    expect(caps.hasSegments).toBe(true)
    expect(caps.main).toEqual({
      hasColor: true,
      hasColorTemp: true,
      hasFlow: true
    })
    expect(caps.background).toEqual({
      hasColor: true,
      hasColorTemp: true,
      hasFlow: true
    })
  })

  test('color-temp-only device (no rgb/hsv)', () => {
    const support = ['set_power', 'set_bright', 'set_ct_abx', 'start_cf']
    const caps = capabilitiesFromSupport(support)

    expect(caps.main.hasColor).toBe(false)
    expect(caps.main.hasColorTemp).toBe(true)
    expect(caps.main.hasFlow).toBe(true)
    expect(caps.hasBackground).toBe(false)
    expect(caps.hasSegments).toBe(false)
    expect(caps.background).toBeNull()
  })

  test('rgb-only device (no ct)', () => {
    const support = ['set_power', 'set_bright', 'set_rgb', 'start_cf']
    const caps = capabilitiesFromSupport(support)

    expect(caps.main.hasColor).toBe(true)
    expect(caps.main.hasColorTemp).toBe(false)
  })

  test('hsv counts as color support', () => {
    const support = ['set_hsv']
    const caps = capabilitiesFromSupport(support)

    expect(caps.main.hasColor).toBe(true)
  })

  test('background detected via bg_set_power', () => {
    const support = ['set_power', 'bg_set_power']
    const caps = capabilitiesFromSupport(support)

    expect(caps.hasBackground).toBe(true)
    expect(caps.background).not.toBeNull()
    expect(caps.background!.hasColor).toBe(false)
  })

  test('background detected via bg_set_rgb', () => {
    const support = ['set_power', 'bg_set_rgb']
    const caps = capabilitiesFromSupport(support)

    expect(caps.hasBackground).toBe(true)
    expect(caps.background!.hasColor).toBe(true)
  })

  test('empty support array', () => {
    const caps = capabilitiesFromSupport([])

    expect(caps.hasBackground).toBe(false)
    expect(caps.hasSegments).toBe(false)
    expect(caps.main).toEqual({
      hasColor: false,
      hasColorTemp: false,
      hasFlow: false
    })
    expect(caps.background).toBeNull()
  })

  test('segments require set_segment_rgb', () => {
    const support = ['set_power', 'set_rgb', 'set_segment_rgb']
    const caps = capabilitiesFromSupport(support)

    expect(caps.hasSegments).toBe(true)
  })
})

describe('capabilitiesFromProps', () => {
  test('full probe — all properties present', () => {
    const caps = capabilitiesFromProps([
      '4000',
      '16711680',
      'on',
      '3500',
      '255'
    ])

    expect(caps.main.hasColor).toBe(true)
    expect(caps.main.hasColorTemp).toBe(true)
    expect(caps.main.hasFlow).toBe(true)
    expect(caps.hasBackground).toBe(true)
    expect(caps.background!.hasColor).toBe(true)
    expect(caps.background!.hasColorTemp).toBe(true)
    expect(caps.background!.hasFlow).toBe(true)
  })

  test('no background — bg_power empty', () => {
    const caps = capabilitiesFromProps(['4000', '16711680', '', '', ''])

    expect(caps.hasBackground).toBe(false)
    expect(caps.background).toBeNull()
  })

  test('no color — rgb empty', () => {
    const caps = capabilitiesFromProps(['4000', '', '', '', ''])

    expect(caps.main.hasColor).toBe(false)
    expect(caps.main.hasColorTemp).toBe(true)
  })

  test('no ct — ct empty', () => {
    const caps = capabilitiesFromProps(['', '16711680', '', '', ''])

    expect(caps.main.hasColorTemp).toBe(false)
    expect(caps.main.hasColor).toBe(true)
  })

  test('all empty — minimal device', () => {
    const caps = capabilitiesFromProps(['', '', '', '', ''])

    expect(caps.main.hasColor).toBe(false)
    expect(caps.main.hasColorTemp).toBe(false)
    expect(caps.main.hasFlow).toBe(false)
    expect(caps.hasBackground).toBe(false)
    expect(caps.hasSegments).toBe(false)
  })

  test('bg_ct and bg_rgb inferred independently', () => {
    // bg_power present but bg_ct absent — background has color but not ct
    const caps = capabilitiesFromProps([
      '4000',
      '16711680',
      'on',
      '',
      '16711680'
    ])

    expect(caps.hasBackground).toBe(true)
    expect(caps.background!.hasColor).toBe(true)
    expect(caps.background!.hasColorTemp).toBe(false)
  })
})
