import { useEffect, useMemo, useState } from 'react'

import { formatCount, pluralize } from '../dataset/format'
import { formatDuration } from '../query/duration'
import type { QueryRun } from '../query/run-state'
import { formatCell } from './cell-format'
import { resultsNotice } from './results-notice'
import { ResultsTable, type CellAddress } from './ResultsTable'

/**
 * What the query returned: the grid, and the one line that measures it.
 *
 * This panel is the answer half of the screen, so it holds its shape whether or
 * not there is an answer in it. When there are no rows it says which kind of no
 * rows this is (`results-notice.ts`) over the same ruled surface the grid uses,
 * rather than collapsing to nothing and letting the editor drift down the page.
 */
type ResultsPanelProps = {
  run: QueryRun
}

export function ResultsPanel({ run }: ResultsPanelProps) {
  const [selected, setSelected] = useState<CellAddress | null>(null)

  // A cell address means nothing once a different result is under it.
  useEffect(() => {
    setSelected(null)
  }, [run])

  const notice = resultsNotice(run)
  const result = run.status === 'succeeded' ? run.result : null

  const inspected = useMemo(() => {
    if (result === null || selected === null) {
      return null
    }

    const row = result.rows[selected.row]
    const column = result.columns[selected.column]

    if (row === undefined || column === undefined) {
      return null
    }

    return {
      columnName: column.name,
      rowNumber: selected.row + 1,
      text: formatCell(row[selected.column] ?? null, column.kind).text,
    }
  }, [result, selected])

  return (
    <section className="flex h-full min-h-0 flex-col border-t border-rule-strong bg-paper">
      <div className="flex shrink-0 items-baseline justify-between gap-3 border-b border-rule px-4 py-2">
        <span className="text-micro tracking-[0.08em] text-ink-faint uppercase">Results</span>
      </div>

      {notice === null && result !== null ? (
        <ResultsTable result={result} selected={selected} onSelect={setSelected} />
      ) : null}

      {notice === null ? null : (
        /* The grid a result would have filled, showing through. The surface is
           the same ruled sheet either way: the rows are what is missing, not
           the table. */
        <div className="grid-rules min-h-0 flex-1 overflow-auto px-4 py-6">
          <p
            aria-live="polite"
            className={`text-lead ${run.status === 'running' ? 'text-accent' : 'text-ink-muted'}`}
          >
            {notice.headline}
          </p>
          {notice.detail === null ? null : (
            <p className="mt-1 max-w-prose font-sans text-body text-ink-muted">{notice.detail}</p>
          )}
        </div>
      )}

      {inspected === null ? null : (
        <div className="shrink-0 border-t border-rule bg-surface px-4 py-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-micro text-ink-faint">
              {inspected.columnName} · row {formatCount(inspected.rowNumber)}
            </span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="shrink-0 font-sans text-micro text-ink-muted hover:text-ink"
            >
              Close
            </button>
          </div>
          {/* The value in full, wrapped rather than clipped. This is the only
              place in the grid where a cell is allowed more than one line. */}
          <pre className="mt-1 max-h-28 overflow-auto text-base wrap-anywhere whitespace-pre-wrap text-ink">
            {inspected.text}
          </pre>
        </div>
      )}

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-rule bg-surface px-4 py-2">
        <p className="min-w-0 truncate text-micro text-ink-muted tabular-nums">
          {result === null
            ? ''
            : `${pluralize(result.rowCount, 'row', 'rows')} · ${pluralize(result.columns.length, 'column', 'columns')} · ${formatDuration(result.durationMs)}`}
        </p>
      </div>
    </section>
  )
}
