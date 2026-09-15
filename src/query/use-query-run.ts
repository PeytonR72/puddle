import { useCallback, useEffect, useRef, useState } from 'react'

import { query } from '../duckdb/client'
import { classifyQueryFailure } from './query-failure'
import type { QueryRun } from './run-state'

/**
 * Running the query, and how long it has been going.
 *
 * The statement goes through `src/duckdb/client.ts` like every other one
 * (locked decision 5); this hook is the render state around it.
 */
export type QueryRunHandle = {
  run: QueryRun
  /** Milliseconds since the running query started. Zero when nothing is running. */
  elapsedMs: number
  start: (sql: string) => void
}

/**
 * How often the elapsed counter redraws while a query runs.
 *
 * Fast enough to look live, slow enough that it is not re-rendering the panel
 * on every frame for a number nobody is reading to the millisecond. Most
 * queries at v1 scale finish before the first tick, and never show it at all.
 */
const TICK_MS = 100

export function useQueryRun(): QueryRunHandle {
  const [run, setRun] = useState<QueryRun>({ status: 'idle' })
  const [elapsedMs, setElapsedMs] = useState(0)

  /**
   * Which run is the current one. Cmd+Enter twice in a row is easy to do, and
   * the first result must not land on top of the second.
   */
  const latest = useRef(0)

  useEffect(() => {
    if (run.status !== 'running') {
      setElapsedMs(0)
      return
    }

    const { startedAt } = run
    const ticker = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt)
    }, TICK_MS)

    return () => {
      window.clearInterval(ticker)
    }
  }, [run])

  const start = useCallback((sql: string): void => {
    latest.current += 1
    const token = latest.current
    const isStale = (): boolean => latest.current !== token

    setRun({ status: 'running', startedAt: performance.now() })
    setElapsedMs(0)

    void (async () => {
      try {
        const result = await query(sql)

        if (!isStale()) {
          setRun({ status: 'succeeded', result })
        }
      } catch (cause) {
        if (!isStale()) {
          setRun({ status: 'failed', failure: classifyQueryFailure(cause) })
        }
      }
    })()
  }, [])

  return { run, elapsedMs, start }
}
