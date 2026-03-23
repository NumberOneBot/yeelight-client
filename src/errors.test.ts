import { describe, test, expect } from 'bun:test'
import { UnsupportedError, ConnectionError, DeviceError } from './errors'

describe('UnsupportedError', () => {
  test('has correct name', () => {
    const err = new UnsupportedError('no rgb')
    expect(err.name).toBe('UnsupportedError')
  })

  test('preserves message', () => {
    const err = new UnsupportedError('Channel does not support color')
    expect(err.message).toBe('Channel does not support color')
  })

  test('is instanceof Error', () => {
    const err = new UnsupportedError('test')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('ConnectionError', () => {
  test('has correct name', () => {
    const err = new ConnectionError('timeout')
    expect(err.name).toBe('ConnectionError')
  })

  test('preserves message', () => {
    const err = new ConnectionError('Connection timed out')
    expect(err.message).toBe('Connection timed out')
  })

  test('is instanceof Error', () => {
    const err = new ConnectionError('test')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('DeviceError', () => {
  test('has correct name', () => {
    const err = new DeviceError(-1, 'unsupported method')
    expect(err.name).toBe('DeviceError')
  })

  test('preserves code and message', () => {
    const err = new DeviceError(-5000, 'general error')
    expect(err.code).toBe(-5000)
    expect(err.message).toBe('general error')
  })

  test('is instanceof Error', () => {
    const err = new DeviceError(-1, 'test')
    expect(err).toBeInstanceOf(Error)
  })
})
