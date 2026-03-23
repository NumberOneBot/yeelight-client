import { describe, test, expect } from 'bun:test'
import { capabilitiesFromSupport, capabilitiesFromProbe } from './capabilities'

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

describe('capabilitiesFromProbe', () => {
  test('full probe — all properties present', () => {
    const caps = capabilitiesFromProbe([
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
  })

  test('no background — bg_power empty', () => {
    const caps = capabilitiesFromProbe(['4000', '16711680', '', '', ''])

    expect(caps.hasBackground).toBe(false)
    expect(caps.background).toBeNull()
  })

  test('no color — rgb empty', () => {
    const caps = capabilitiesFromProbe(['4000', '', '', '', ''])

    expect(caps.main.hasColor).toBe(true)
    expect(caps.main.hasColorTemp).toBe(true)
  })

  test('no ct — ct empty', () => {
    const caps = capabilitiesFromProbe(['', '16711680', '', '', ''])

    expect(caps.main.hasColorTemp).toBe(true)
    expect(caps.main.hasColor).toBe(true)
  })

  test('all empty — minimal device', () => {
    const caps = capabilitiesFromProbe(['', '', '', '', ''])

    expect(caps.main.hasColor).toBe(true)
    expect(caps.main.hasColorTemp).toBe(true)
    expect(caps.main.hasFlow).toBe(true)
    expect(caps.hasBackground).toBe(false)
    expect(caps.hasSegments).toBe(true)
  })

  test('segments always true from probe', () => {
    const caps = capabilitiesFromProbe([
      '4000',
      '16711680',
      'on',
      '3500',
      '255'
    ])

    expect(caps.hasSegments).toBe(true)
  })
})
