export type DeviceSort = 'model' | 'ip'

type Sortable = { ip: string; model: string }

/** 192.168.1.9 sorts before 192.168.1.10 — string compare would flip them */
function compareIp(a: string, b: string): number {
  const oa = a.split('.').map(Number)
  const ob = b.split('.').map(Number)
  for (let i = 0; i < 4; i++) {
    const x = oa[i] ?? 0
    const y = ob[i] ?? 0
    if (x !== y) return x - y
  }
  return 0
}

export function compareDevices(sort: DeviceSort) {
  return (a: Sortable, b: Sortable): number => {
    if (sort === 'ip') return compareIp(a.ip, b.ip)
    // Devices of the same model keep a stable, readable order by address
    return a.model.localeCompare(b.model) || compareIp(a.ip, b.ip)
  }
}

export function parseSort(value: unknown): DeviceSort {
  return value === 'ip' ? 'ip' : 'model'
}
