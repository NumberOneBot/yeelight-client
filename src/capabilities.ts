import type { ChannelCapabilities } from './types.js'

export interface Capabilities {
  hasBackground: boolean
  hasSegments: boolean
  main: ChannelCapabilities
  background: ChannelCapabilities | null
}

/**
 * Derives capabilities from the 'support' list provided by SSDP discovery.
 * This is the authoritative path — the support list is what the device itself reports.
 */
export function capabilitiesFromSupport(support: string[]): Capabilities {
  const has = (m: string) => support.includes(m)

  const hasBackground = has('bg_set_power') || has('bg_set_rgb')
  const hasSegments = has('set_segment_rgb')

  const main: ChannelCapabilities = {
    hasColor: has('set_rgb') || has('set_hsv'),
    hasColorTemp: has('set_ct_abx'),
    hasFlow: has('start_cf')
  }

  const background: ChannelCapabilities | null = hasBackground
    ? {
        hasColor: has('bg_set_rgb') || has('bg_set_hsv'),
        hasColorTemp: has('bg_set_ct_abx'),
        hasFlow: has('bg_start_cf')
      }
    : null

  return {
    hasBackground,
    hasSegments,
    main,
    background
  }
}

/**
 * Derives capabilities from a get_prop probe result.
 * Used by YeelightDevice.connect() when no support list is available.
 *
 * propResults must be the result of:
 *   get_prop(['ct', 'rgb', 'bg_power', 'bg_ct', 'bg_rgb'])
 */
export function capabilitiesFromProbe(propResults: string[]): Capabilities {
  const [ct, rgb, bgPower, bgCt, bgRgb] = propResults

  const notEmpty = (v: string | undefined) => v !== '' && v !== undefined

  const hasBackground = notEmpty(bgPower)

  const main: ChannelCapabilities = {
    hasColor: notEmpty(rgb),
    hasColorTemp: notEmpty(ct),
    hasFlow: true
  }

  const background: ChannelCapabilities | null = hasBackground
    ? {
        hasColor: notEmpty(bgRgb),
        hasColorTemp: notEmpty(bgCt),
        hasFlow: true
      }
    : null

  return {
    hasBackground,
    hasSegments: false,
    main,
    background
  }
}
