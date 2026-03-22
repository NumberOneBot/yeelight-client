import { useEffect, useState } from 'react'
import type { ChannelState, YeelightDevice } from 'yeelight-client'
import type { PropItem } from './items'
import { rgbItems } from './items'

type Channel = YeelightDevice['main']

export function usePropertyExec(
  ch: Channel,
  initial: ChannelState | null,
  onBack: (state: ChannelState | null) => void
) {
  const [liveState, setLiveState] = useState<ChannelState | null>(initial)
  const [executing, setExecuting] = useState(false)
  const [done, setDone] = useState(false)
  const [execError, setExecError] = useState<string | null>(null)
  const [hexMode, setHexMode] = useState(false)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 800)
    return () => clearTimeout(t)
  }, [done])

  function isCurrent(item: PropItem): boolean {
    if (!liveState) return false
    if (item.kind === 'brightness') return liveState.brightness === item.value
    if (item.kind === 'ct') return liveState.colorTemp === item.value
    if (item.kind === 'rgb') {
      if (!liveState.rgb) return false
      if (item.r < 0) {
        return !rgbItems.some(
          (i) =>
            i.kind === 'rgb' &&
            i.r >= 0 &&
            liveState.rgb![0] === i.r &&
            liveState.rgb![1] === i.g &&
            liveState.rgb![2] === i.b
        )
      }
      return (
        liveState.rgb[0] === item.r &&
        liveState.rgb[1] === item.g &&
        liveState.rgb[2] === item.b
      )
    }
    return false
  }

  function applyRGB(r: number, g: number, b: number) {
    if (executing) return
    setExecuting(true)
    setDone(false)
    setExecError(null)
    void ch
      .setRGB(r, g, b)
      .then(() => {
        setDone(true)
        setLiveState((s) =>
          s ? { ...s, rgb: [r, g, b] as [number, number, number] } : s
        )
      })
      .catch((e: Error) => setExecError(e.message))
      .finally(() => setExecuting(false))
  }

  function execute(item: PropItem) {
    if (item.kind === 'back') {
      onBack(liveState)
      return
    }
    if (executing) return
    if (item.kind === 'rgb' && item.r < 0) {
      setHexMode(true)
      return
    }

    let promise: Promise<void> | null = null
    if (item.kind === 'brightness') {
      promise = ch.setBrightness(item.value)
    } else if (item.kind === 'ct') {
      promise = ch.setColorTemp(item.value)
    } else if (item.kind === 'rgb') {
      promise = ch.setRGB(item.r, item.g, item.b)
    }
    if (!promise) return

    setExecuting(true)
    setDone(false)
    setExecError(null)
    void promise
      .then(() => {
        setDone(true)
        setLiveState((s) => {
          if (!s) return s
          if (item.kind === 'brightness') return { ...s, brightness: item.value }
          if (item.kind === 'ct') return { ...s, colorTemp: item.value }
          if (item.kind === 'rgb')
            return { ...s, rgb: [item.r, item.g, item.b] as [number, number, number] }
          return s
        })
      })
      .catch((e: Error) => setExecError(e.message))
      .finally(() => setExecuting(false))
  }

  return { liveState, executing, done, execError, hexMode, setHexMode, isCurrent, applyRGB, execute }
}
