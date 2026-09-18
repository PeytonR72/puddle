import { useCallback, useEffect, useRef, useState } from 'react'

import { initialize, type EngineProgress } from './client'

/**
 * Where the engine has got to.
 *
 * `idle` is the state the landing page renders in, and it is the important one:
 * DuckDB is several megabytes and nothing fetches it until someone asks
 * (locked decision 1).
 */
export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error'

export type DuckDBHandle = {
  status: EngineStatus
  /** Non-null while the WASM module downloads, for a determinate progress bar. */
  progress: EngineProgress | null
  error: Error | null
  /**
   * Boot the engine, resolving with the status it settled on. Safe to call
   * repeatedly; only the first call does work.
   *
   * It resolves with the status rather than `void` because `status` below is a
   * render behind: a click handler that wants to know whether it may query has
   * to read the answer here.
   */
  start: () => Promise<EngineStatus>
}

/**
 * Status for the engine. Queries do not go through here: they go through
 * `client.ts`, which is the module that owns DuckDB (locked decision 5). This
 * hook exists so a component can render the boot, not to wrap the API.
 */
export function useDuckDB(): DuckDBHandle {
  const [status, setStatus] = useState<EngineStatus>('idle')
  const [progress, setProgress] = useState<EngineProgress | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Status as state lags a click by a render, so the guard reads the ref.
  const statusRef = useRef<EngineStatus>('idle')
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  const start = useCallback(async (): Promise<EngineStatus> => {
    if (statusRef.current === 'loading' || statusRef.current === 'ready') {
      return statusRef.current
    }

    statusRef.current = 'loading'
    setStatus('loading')
    setProgress(null)
    setError(null)

    try {
      await initialize((next) => {
        if (mounted.current) {
          setProgress(next)
        }
      })

      statusRef.current = 'ready'

      if (mounted.current) {
        setStatus('ready')
      }
    } catch (cause) {
      statusRef.current = 'error'

      if (mounted.current) {
        setError(cause instanceof Error ? cause : new Error(String(cause)))
        setStatus('error')
      }
    }

    return statusRef.current
  }, [])

  return { status, progress, error, start }
}
