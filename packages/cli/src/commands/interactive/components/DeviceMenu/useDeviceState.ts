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
    device.main
      .getState()
      .then((s) => {
        onFetched?.('main', s)
        setMainState(s)
      })
      .catch(() => {})
    device.background
      ?.getState()
      .then((s) => {
        onFetched?.('bg', s)
        setBgState(s)
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
      const state = await ch.getState()
      onDone?.(state)
      if (channel === 'bg') setBgState(state)
      else setMainState(state)
    })
  }

  return { mainState, bgState, updateState, togglePower, toggle }
}
