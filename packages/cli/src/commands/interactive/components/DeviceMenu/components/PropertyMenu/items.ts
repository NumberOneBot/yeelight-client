export type Prop = 'brightness' | 'ct' | 'rgb'

export type BrightnessItem = { kind: 'brightness'; value: number }
export type CtItem = { kind: 'ct'; value: number }
export type RgbItem = {
  kind: 'rgb'
  label: string
  r: number
  g: number
  b: number
}
export type BackItem = { kind: 'back' }
export type PropItem = BrightnessItem | CtItem | RgbItem | BackItem

export const brightnessItems: PropItem[] = [
  ...[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => ({
    kind: 'brightness' as const,
    value: v
  })),
  { kind: 'back' as const }
]

const ctItems2700: PropItem[] = [
  ...[2700, 3000, 3500, 4000, 4500, 5000, 6000, 6500].map((v) => ({
    kind: 'ct' as const,
    value: v
  })),
  { kind: 'back' as const }
]

const ctItems1700: PropItem[] = [
  ...[1700, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 6500].map((v) => ({
    kind: 'ct' as const,
    value: v
  })),
  { kind: 'back' as const }
]

export const rgbItems: PropItem[] = [
  { kind: 'rgb', label: 'red', r: 255, g: 0, b: 0 },
  { kind: 'rgb', label: 'orange', r: 255, g: 100, b: 0 },
  { kind: 'rgb', label: 'amber', r: 255, g: 180, b: 0 },
  { kind: 'rgb', label: 'yellow', r: 255, g: 255, b: 0 },
  { kind: 'rgb', label: 'lime', r: 128, g: 255, b: 0 },
  { kind: 'rgb', label: 'green', r: 0, g: 200, b: 0 },
  { kind: 'rgb', label: 'teal', r: 0, g: 200, b: 150 },
  { kind: 'rgb', label: 'cyan', r: 0, g: 255, b: 255 },
  { kind: 'rgb', label: 'sky', r: 0, g: 150, b: 255 },
  { kind: 'rgb', label: 'blue', r: 0, g: 0, b: 255 },
  { kind: 'rgb', label: 'indigo', r: 60, g: 0, b: 200 },
  { kind: 'rgb', label: 'violet', r: 150, g: 0, b: 255 },
  { kind: 'rgb', label: 'magenta', r: 255, g: 0, b: 200 },
  { kind: 'rgb', label: 'pink', r: 255, g: 0, b: 100 },
  { kind: 'rgb', label: 'custom', r: -1, g: -1, b: -1 },
  { kind: 'back' as const }
]

export function propItems(prop: Prop, ctRange?: [number, number] | null): PropItem[] {
  if (prop === 'brightness') return brightnessItems
  if (prop === 'ct') return ctRange?.[0] <= 1700 ? ctItems1700 : ctItems2700
  return rgbItems
}

export function propLabel(prop: Prop): string {
  if (prop === 'brightness') return 'Brightness'
  if (prop === 'ct') return 'Color temperature'
  return 'Color'
}
