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
 * Used by YeelightDevice.connect() when no SSDP support list is available.
 * Computes Capabilities directly from prop values — no intermediate support[].
 *
 * propResults must be the result of:
 *   get_prop(['ct', 'rgb', 'bg_power', 'bg_ct', 'bg_rgb'])
 */
export function capabilitiesFromProps(propResults: string[]): Capabilities {
  const [ct, rgb, bgPower, bgCt, bgRgb] = propResults

  const hasColor = !!(rgb && rgb !== '0')
  const hasColorTemp = !!ct
  const hasBackground = !!bgPower

  const main: ChannelCapabilities = {
    hasColor,
    hasColorTemp,
    hasFlow: hasColor || hasColorTemp
  }

  const background: ChannelCapabilities | null = hasBackground
    ? {
        hasColor: !!(bgRgb && bgRgb !== '0'),
        hasColorTemp: !!bgCt,
        hasFlow: !!(bgRgb && bgRgb !== '0') || !!bgCt
      }
    : null

  return { hasBackground, hasSegments: false, main, background }
}
