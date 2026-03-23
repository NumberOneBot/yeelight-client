import { useEffect, useState } from 'react'
import { useApp } from 'ink'

export function useOneShot(fn: () => Promise<void>) {
  const { exit } = useApp()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fn()
      .catch((e: any) => {
        setError(e.message)
        process.exitCode = 1
      })
      .finally(() => exit())
  }, [])

  return error
}
