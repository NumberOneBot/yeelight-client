import { describe, test, expect } from 'bun:test'
import { compareDevices, parseSort } from './sort'

const dev = (ip: string, model: string) => ({ ip, model })

describe('compareDevices', () => {
  test('sorts by model, ties broken by ip', () => {
    const list = [
      dev('192.168.1.10', 'stripe6'),
      dev('192.168.1.20', 'color4'),
      dev('192.168.1.3', 'color4')
    ]
    expect(list.sort(compareDevices('model')).map((d) => d.ip)).toEqual([
      '192.168.1.3',
      '192.168.1.20',
      '192.168.1.10'
    ])
  })

  test('sorts ip by octet, not lexicographically', () => {
    const list = [
      dev('192.168.1.10', 'a'),
      dev('192.168.1.9', 'b'),
      dev('192.168.10.1', 'c'),
      dev('192.168.2.1', 'd')
    ]
    expect(list.sort(compareDevices('ip')).map((d) => d.ip)).toEqual([
      '192.168.1.9',
      '192.168.1.10',
      '192.168.2.1',
      '192.168.10.1'
    ])
  })
})

describe('parseSort', () => {
  test('accepts ip, falls back to model', () => {
    expect(parseSort('ip')).toBe('ip')
    expect(parseSort('model')).toBe('model')
    expect(parseSort('nonsense')).toBe('model')
    expect(parseSort(undefined)).toBe('model')
  })
})
