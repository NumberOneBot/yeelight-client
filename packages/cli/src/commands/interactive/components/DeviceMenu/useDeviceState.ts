import { useEffect, useState } from 'react'
import type { ChannelState, YeelightDevice } from 'yeelight-client'
import { useAsyncAction } from '../../useAsyncAction'

export function useDeviceState(
  device: YeelightDevice,
  onFetched?: (channel: 'main' | 'bg', state: ChannelState) => void
) {
  const [mainState, setMainState] = useState<ChannelState | null>(null)
  const [bgState, setBgState] = useState<ChannelState | null>(null)
  const toggle = useAsyncAction()

  useEffect(() => {
    device
      .getState()
      .then(({ main, bg }) => {
        onFetched?.('main', main)
        setMainState(main)
        if (bg) {
          onFetched?.('bg', bg)
          setBgState(bg)
        }
      })
      .catch(() => {})
  }, [device])

  useEffect(() => {
    const t = setInterval(() => {
      device.getRawProps(['power']).catch(() => {})
    }, 30_000)
    return () => clearInterval(t)
  }, [device])

  function updateState(channel: 'main' | 'bg', state: ChannelState | null) {
    if (channel === 'bg') setBgState(state)
    else setMainState(state)
  }

  function togglePower(
    channel: 'main' | 'bg',
    onDone?: (state: ChannelState) => void
  ) {
    const ch = channel === 'bg' ? device.background! : device.main
    toggle.run(async () => {
      await ch.toggle()
      const { main, bg } = await device.getState()
      const state = channel === 'bg' ? bg : main
      if (!state) return
      onDone?.(state)
      if (channel === 'bg') setBgState(state)
      else setMainState(state)
    })
  }

  return { mainState, bgState, updateState, togglePower, toggle }
}
