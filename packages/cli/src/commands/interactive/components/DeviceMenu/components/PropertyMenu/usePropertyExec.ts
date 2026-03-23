import { useState } from 'react'
import type { ChannelState, YeelightDevice } from 'yeelight-client'
import { useAsyncAction } from '../../../../useAsyncAction'
import type { PropItem } from './items'
import { rgbItems } from './items'

type Channel = YeelightDevice['main']

export function usePropertyExec(
  ch: Channel,
  initial: ChannelState | null,
  onBack: (state: ChannelState | null) => void
) {
  const [liveState, setLiveState] = useState<ChannelState | null>(initial)
  const [hexMode, setHexMode] = useState(false)
  const action = useAsyncAction()

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
    action.run(async () => {
      await ch.setRGB(r, g, b, { duration: 500 })
      setLiveState((s) =>
        s ? { ...s, rgb: [r, g, b] as [number, number, number] } : s
      )
    })
  }

  function execute(item: PropItem) {
    if (item.kind === 'back') {
      onBack(liveState)
      return
    }
    if (item.kind === 'rgb' && item.r < 0) {
      setHexMode(true)
      return
    }

    action.run(async () => {
      if (item.kind === 'brightness') {
        await ch.setBrightness(item.value, { duration: 500 })
      } else if (item.kind === 'ct') {
        await ch.setColorTemp(item.value, { duration: 500 })
      } else if (item.kind === 'rgb') {
        await ch.setRGB(item.r, item.g, item.b, { duration: 500 })
      }
      setLiveState((s) => {
        if (!s) return s
        if (item.kind === 'brightness') return { ...s, brightness: item.value }
        if (item.kind === 'ct') return { ...s, colorTemp: item.value }
        if (item.kind === 'rgb')
          return {
            ...s,
            rgb: [item.r, item.g, item.b] as [number, number, number]
          }
        return s
      })
    })
  }

  return {
    liveState,
    ...action,
    hexMode,
    setHexMode,
    isCurrent,
    applyRGB,
    execute
  }
}
