export function hex2(n: number): string {
  return n.toString(16).padStart(2, '0').toUpperCase()
}

export function rgbHex(r: number, g: number, b: number): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`
}

export function ctToColor(kelvin: number): string {
  const t = kelvin / 100
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
  if (kelvin >= 4000 && kelvin <= 5000) {
    const blend = ((kelvin - 4000) / 1000) * 0.9
    r = Math.round(r + (255 - r) * blend)
    g = Math.round(g + (255 - g) * blend)
    b = Math.round(b + (255 - b) * blend)
  }
  if (kelvin > 5000) {
    const cool = (kelvin - 5000) / 1500
    r = Math.round(Math.max(0, r - cool * 30))
    b = Math.round(Math.min(255, b + cool * 15))
  }
  return rgbHex(r, g, b)
}
