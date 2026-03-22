import { useEffect, useState } from 'react'
import { Text } from 'ink'

const frames = ['.', '..', '...']

export function Dots() {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const timer = setInterval(
      () => setFrame((f) => (f + 1) % frames.length),
      400
    )
    return () => clearInterval(timer)
  }, [])

  return <Text>{frames[frame]}</Text>
}
