import type { YeelightDevice } from 'yeelight-client'

export type RowKind =
  | 'section'
  | 'power'
  | 'brightness'
  | 'ct'
  | 'rgb'
  | 'segments'
  | 'back'

export type MenuRow = {
  kind: RowKind
  label: string
  channel: 'main' | 'bg' | null
  sep?: boolean
}

export type SubScreen =
  | {
      kind: 'property'
      channel: 'main' | 'bg'
      prop: 'brightness' | 'ct' | 'rgb'
    }
  | { kind: 'segments' }

export function buildRows(device: YeelightDevice, canGoBack = true): MenuRow[] {
  const { main: ch, background: bg } = device
  const rows: MenuRow[] = [
    { kind: 'section', label: 'Main channel', channel: null },
    { kind: 'power', label: 'Power', channel: 'main' },
    { kind: 'brightness', label: 'Brightness', channel: 'main' }
  ]
  if (ch.capabilities.hasColorTemp)
    rows.push({ kind: 'ct', label: 'Color temp', channel: 'main' })
  if (ch.capabilities.hasColor)
    rows.push({ kind: 'rgb', label: 'Color', channel: 'main' })

  if (bg) {
    rows.push({
      kind: 'section',
      label: 'Background channel',
      channel: null,
      sep: true
    })
    rows.push({ kind: 'power', label: 'Power', channel: 'bg' })
    rows.push({ kind: 'brightness', label: 'Brightness', channel: 'bg' })
    if (bg.capabilities.hasColorTemp)
      rows.push({ kind: 'ct', label: 'Color temp', channel: 'bg' })
    if (bg.capabilities.hasColor)
      rows.push({ kind: 'rgb', label: 'Color', channel: 'bg' })
    if (device.capabilities.hasSegments)
      rows.push({ kind: 'segments', label: 'Segments', channel: 'bg' })
  }

  if (canGoBack)
    rows.push({
      kind: 'back',
      label: '↩ Back to devices',
      channel: null,
      sep: true
    })
  return rows
}
