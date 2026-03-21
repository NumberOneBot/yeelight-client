// fmt.ts -- string ANSI helpers; most output now handled by Ink <Text> components

/** True-color block swatch as a raw ANSI string (used for non-Ink contexts) */
export const swatch = (r: number, g: number, b: number): string => {
  if (process.env.NO_COLOR) return ''
  return `\x1b[38;2;${r};${g};${b}m\u2588\u2588\x1b[0m`
}
