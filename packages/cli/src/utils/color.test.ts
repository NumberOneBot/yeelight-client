import { describe, test, expect } from 'bun:test'
import { hex2, rgbHex, parseHex, ctToColor } from './color'

describe('hex2', () => {
  test('pads single digit', () => {
    expect(hex2(0)).toBe('00')
    expect(hex2(5)).toBe('05')
    expect(hex2(15)).toBe('0F')
  })

  test('two digits uppercase', () => {
    expect(hex2(255)).toBe('FF')
    expect(hex2(171)).toBe('AB')
    expect(hex2(16)).toBe('10')
  })
})

describe('rgbHex', () => {
  test('formats rgb as #RRGGBB', () => {
    expect(rgbHex(255, 100, 0)).toBe('#FF6400')
    expect(rgbHex(0, 0, 0)).toBe('#000000')
    expect(rgbHex(255, 255, 255)).toBe('#FFFFFF')
  })
})

describe('parseHex', () => {
  test('parses #RRGGBB', () => {
    expect(parseHex('#ff6400')).toEqual({ r: 255, g: 100, b: 0, a: null })
    expect(parseHex('#000000')).toEqual({ r: 0, g: 0, b: 0, a: null })
    expect(parseHex('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255, a: null })
  })

  test('parses #RGB shorthand', () => {
    expect(parseHex('#f00')).toEqual({ r: 255, g: 0, b: 0, a: null })
    expect(parseHex('#abc')).toEqual({ r: 170, g: 187, b: 204, a: null })
  })

  test('parses #RRGGBBAA', () => {
    expect(parseHex('#ff640080')).toEqual({ r: 255, g: 100, b: 0, a: 128 })
    expect(parseHex('#000000ff')).toEqual({ r: 0, g: 0, b: 0, a: 255 })
  })

  test('parses #RGBA shorthand', () => {
    expect(parseHex('#f008')).toEqual({ r: 255, g: 0, b: 0, a: 136 })
  })

  test('returns null for invalid input', () => {
    expect(parseHex('')).toBeNull()
    expect(parseHex('ff6400')).toBeNull() // no #
    expect(parseHex('#gg0000')).toBeNull() // invalid hex chars
    expect(parseHex('#ff')).toBeNull() // too short
    expect(parseHex('#ff00000')).toBeNull() // 7 chars — invalid length
    expect(parseHex('#ff000000f')).toBeNull() // 9 chars — too long
  })

  test('case insensitive', () => {
    expect(parseHex('#FF6400')).toEqual(parseHex('#ff6400'))
    expect(parseHex('#AbCdEf')).toEqual({ r: 171, g: 205, b: 239, a: null })
  })
})

describe('ctToColor', () => {
  test('returns hex string', () => {
    const result = ctToColor(4000)
    expect(result).toMatch(/^#[0-9A-F]{6}$/)
  })

  test('warm temperature (1700K) is reddish', () => {
    const result = ctToColor(1700)
    const parsed = parseHex(result)!
    expect(parsed.r).toBe(255)
    expect(parsed.g).toBeLessThan(130)
    expect(parsed.b).toBe(0)
  })

  test('cool temperature (6500K) is bluish-white', () => {
    const result = ctToColor(6500)
    const parsed = parseHex(result)!
    // Cool light: high blue, less red
    expect(parsed.b).toBeGreaterThan(200)
    expect(parsed.r).toBeLessThan(parsed.b)
  })

  test('neutral temperature (4500K) is near white', () => {
    const result = ctToColor(4500)
    const parsed = parseHex(result)!
    // All channels should be high (near white)
    expect(parsed.r).toBeGreaterThan(200)
    expect(parsed.g).toBeGreaterThan(200)
    expect(parsed.b).toBeGreaterThan(200)
  })

  test('returns valid hex for boundary values', () => {
    expect(ctToColor(1700)).toMatch(/^#[0-9A-F]{6}$/)
    expect(ctToColor(6500)).toMatch(/^#[0-9A-F]{6}$/)
  })
})
