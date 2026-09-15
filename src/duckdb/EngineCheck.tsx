/**
 * Temporary. This is a wiring check for src/duckdb/client.ts, not a design —
 * it proves the engine boots on a click and answers a query. Delete it (and its
 * one line in App.tsx) when the real interface lands.
 */
import { useState } from 'react'

import { query, type ResultValue } from './client'
import { useDuckDB } from './use-duckdb'

export function EngineCheck() {
  const engine = useDuckDB()
  const [answer, setAnswer] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const run = async (): Promise<void> => {
    setAnswer(null)
    setFailure(null)

    // The hook renders the boot failure itself; querying a dead engine here
    // would only print a second, vaguer message underneath it.
    if ((await engine.start()) !== 'ready') {
      return
    }

    try {
      const result = await query('SELECT 42 AS answer')
      const cell = result.rows[0]?.[0]

      setAnswer(`${formatCell(cell)} — ${result.rowCount} row in ${result.durationMs.toFixed(1)}ms`)
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : String(cause))
    }
  }

  const booting = engine.status === 'loading'

  return (
    <section className="mt-10 border-t border-slate-200 pt-6">
      <p className="text-xs uppercase tracking-widest text-slate-400">Engine check</p>

      <button
        type="button"
        onClick={() => void run()}
        disabled={booting}
        className="mt-3 rounded bg-slate-900 px-4 py-2 font-mono text-sm text-white disabled:opacity-50"
      >
        {booting ? 'Starting DuckDB…' : 'Run SELECT 42'}
      </button>

      <p className="mt-3 font-mono text-xs text-slate-500">status: {engine.status}</p>

      {engine.progress ? (
        <div className="mt-2 max-w-sm">
          <div className="h-1 w-full rounded bg-slate-200">
            <div
              className="h-1 rounded bg-slate-900 transition-[width]"
              style={{ width: `${Math.round(engine.progress.ratio * 100)}%` }}
            />
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500">
            {formatBytes(engine.progress.bytesLoaded)} of {formatBytes(engine.progress.bytesTotal)}
          </p>
        </div>
      ) : null}

      {answer ? <p className="mt-3 font-mono text-sm">answer: {answer}</p> : null}

      {engine.error ? (
        <p className="mt-3 font-mono text-sm text-red-700">{engine.error.message}</p>
      ) : null}

      {failure ? <p className="mt-3 font-mono text-sm text-red-700">{failure}</p> : null}
    </section>
  )
}

function formatCell(value: ResultValue | undefined): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return typeof value === 'object' ? '(nested)' : String(value)
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)}MB`
}
