import { useEffect, useState } from 'react'

export function useAsyncAction() {
  const [executing, setExecuting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 800)
    return () => clearTimeout(t)
  }, [done])

  function run(fn: () => Promise<void>) {
    if (executing) return
    setExecuting(true)
    setDone(false)
    setError(null)
    void fn()
      .then(() => setDone(true))
      .catch((e: Error) => setError(e.message))
      .finally(() => setExecuting(false))
  }

  return { executing, done, error, run }
}
