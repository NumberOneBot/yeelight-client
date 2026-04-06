export function hex2(n: number): string {
  return n.toString(16).padStart(2, '0').toUpperCase()
}

export function rgbHex(r: number, g: number, b: number): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`
}

export type ParsedHex = { r: number; g: number; b: number; a: number | null }

export function parseHex(input: string): ParsedHex | null {
  if (!input.startsWith('#')) return null
  const raw = input.slice(1)
  if (!/^[0-9a-fA-F]+$/.test(raw)) return null

  let r: number,
    g: number,
    b: number,
    a: number | null = null

  if (raw.length === 3 || raw.length === 4) {
    r = parseInt(raw[0] + raw[0], 16)
    g = parseInt(raw[1] + raw[1], 16)
    b = parseInt(raw[2] + raw[2], 16)
    if (raw.length === 4) a = parseInt(raw[3] + raw[3], 16)
  } else if (raw.length === 6 || raw.length === 8) {
    r = parseInt(raw.slice(0, 2), 16)
    g = parseInt(raw.slice(2, 4), 16)
    b = parseInt(raw.slice(4, 6), 16)
    if (raw.length === 8) a = parseInt(raw.slice(6, 8), 16)
  } else {
    return null
  }

  return { r, g, b, a }
}

const CT_MIN = 1700
const CT_MAX = 6500
const CT_ALGO_MAX = 7500

export function ctToColor(kelvin: number): string {
  const mapped = CT_MIN + ((kelvin - CT_MIN) / (CT_MAX - CT_MIN)) * (CT_ALGO_MAX - CT_MIN)
  const t = mapped / 100
  let r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592
  r = Math.round(Math.max(0, Math.min(255, r)))
  let g =
    t <= 66
      ? 99.4708025861 * Math.log(t) - 161.1195681661
      : 288.1221695283 * (t - 60) ** -0.0755148492
  g = Math.round(Math.max(0, Math.min(255, g)))
  let b =
    t >= 66
      ? 255
      : t <= 19
        ? 0
        : 138.5177312231 * Math.log(t - 10) - 305.0447927307
  b = Math.round(Math.max(0, Math.min(255, b)))
  return rgbHex(r, g, b)
}
