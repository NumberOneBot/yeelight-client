import type { ChannelCapabilities } from './types.js'
// ChannelCapabilities imported but used only in capabilitiesFromSupport — no change needed

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
 * Builds a synthetic support list from prop values, then delegates to
 * capabilitiesFromSupport — same approach as the TCP scan path.
 *
 * propResults must be the result of:
 *   get_prop(['ct', 'rgb', 'bg_power', 'bg_ct', 'bg_rgb'])
 */
export function capabilitiesFromProbe(propResults: string[]): Capabilities {
  const [ct, rgb, bgPower, bgCt, bgRgb] = propResults
  const support: string[] = []

  if (ct) support.push('set_ct_abx', 'start_cf')
  if (rgb && rgb !== '0') support.push('set_rgb', 'set_hsv')
  if (bgPower) support.push('bg_set_power', 'bg_start_cf')
  if (bgCt) support.push('bg_set_ct_abx')
  if (bgRgb && bgRgb !== '0') support.push('bg_set_rgb', 'bg_set_hsv')

  return capabilitiesFromSupport(support)
}
