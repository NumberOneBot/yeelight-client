export type RGB = [number, number, number]
export type SegItem =
  | { kind: 'left' }
  | { kind: 'right' }
  | { kind: 'apply' }
  | { kind: 'back' }
