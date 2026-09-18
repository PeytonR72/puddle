import { forwardRef, useId, useMemo } from 'react'

import type { Dataset } from '../dataset/load-dataset'
import { formatDuration } from './duration'
import { QueryEditor, type QueryEditorHandle } from './QueryEditor'
import { runBlockedReason, type QueryRun } from './run-state'
import { runShortcutLabel } from './run-shortcut'

/**
 * The editor, the Run control, and whatever DuckDB last said about the query.
 *
 * The order down the panel is the order the eye needs it: the SQL, then the
 * error it produced, then the button that produced it. Run sits at the bottom
 * on purpose: it is the one control on this screen a thumb has to reach, and
 * the bottom edge of a `dvh` layout stays above the on-screen keyboard.
 *
 * A failed query is written into the panel and left there. Not a toast: the
 * message is the most useful text on the screen, it is often several lines of
 * DuckDB pointing at a column name, and it has to survive being read twice
 * while the query is edited.
 */
type QueryPanelProps = {
  /** `null` before a file is loaded: the editor is on screen but has no data. */
  dataset: Dataset | null
  value: string
  onChange: (value: string) => void
  /**
   * The run lives above this panel, because the results panel below renders the
   * same run. One run, two views of it.
   */
  run: QueryRun
  elapsedMs: number
  onRun: (sql: string) => void
}

export const QueryPanel = forwardRef<QueryEditorHandle, QueryPanelProps>(function QueryPanel(
  { dataset, value, onChange, run, elapsedMs, onRun },
  ref,
) {
  const reasonId = useId()

  // A new array every render would reconfigure the editor every render.
  const columnNames = useMemo(
    () => (dataset === null ? [] : dataset.columns.map((column) => column.name)),
    [dataset],
  )

  const isRunning = run.status === 'running'
  const blockedReason = runBlockedReason({ hasDataset: dataset !== null, isRunning, query: value })
  const shortcut = runShortcutLabel(navigator.userAgent)

  const runQuery = (sql: string): void => {
    if (runBlockedReason({ hasDataset: dataset !== null, isRunning, query: sql }) === null) {
      onRun(sql)
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-paper">
      <div className="flex shrink-0 items-baseline justify-between border-b border-rule px-4 py-2">
        <span className="text-micro tracking-[0.08em] text-ink-faint uppercase">Query</span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <QueryEditor
          ref={ref}
          value={value}
          columnNames={columnNames}
          editable={dataset !== null}
          placeholderText={dataset === null ? '-- Load a file to query it' : '-- SELECT * FROM data'}
          onChange={onChange}
          onRun={runQuery}
        />
      </div>

      {run.status === 'failed' ? (
        <div
          role="alert"
          className="shrink-0 border-t border-rule border-l-2 border-l-failed bg-failed-soft px-4 py-3"
        >
          <p className="text-base text-failed">{run.failure.headline}</p>
          {/* DuckDB's own words, verbatim and wrapped. It names the column it
              could not find, and often the one it thinks you meant. */}
          <pre className="mt-2 max-h-40 overflow-auto text-micro leading-relaxed whitespace-pre-wrap text-ink">
            {run.failure.engineMessage}
          </pre>
        </div>
      ) : null}

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-rule bg-surface px-4 py-2">
        <p
          id={reasonId}
          /* The elapsed counter redraws every tenth of a second. Announcing it
             would read the same sentence over and over; the settled outcome is
             the part worth hearing. */
          aria-live={isRunning ? 'off' : 'polite'}
          className={`min-w-0 truncate font-sans text-micro tabular-nums ${
            isRunning ? 'text-accent' : 'text-ink-muted'
          }`}
        >
          {statusText({ run, elapsedMs, blockedReason })}
        </p>

        <div className="flex shrink-0 items-center gap-3">
          <span aria-hidden="true" className="hidden text-micro text-ink-faint md:inline">
            {shortcut}
          </span>

          <button
            type="button"
            onClick={() => runQuery(value)}
            disabled={blockedReason !== null}
            aria-keyshortcuts="Meta+Enter Control+Enter"
            aria-describedby={blockedReason === null ? undefined : reasonId}
            /* 44px on a touch layout, 32px once there is a pointer. */
            className="inline-flex h-11 items-center rounded-control border border-ink bg-ink px-4 font-mono text-base text-paper transition-colors duration-[var(--duration-fast)] ease-out hover:border-ink-muted hover:bg-ink-muted disabled:cursor-not-allowed disabled:border-rule-strong disabled:bg-surface disabled:text-ink-faint md:h-8"
          >
            {isRunning ? 'Running' : 'Run query'}
          </button>
        </div>
      </div>
    </section>
  )
})

type StatusInput = {
  run: QueryRun
  elapsedMs: number
  blockedReason: string | null
}

/**
 * The one line under the editor. It answers whichever question is live: how
 * long this is taking, or why Run will not work.
 *
 * Neither outcome is reported here. A failure's message says considerably more
 * than a word in this line could, and it is directly above; what a successful
 * query cost is measured in the results footer, beside the rows it counts.
 * Saying either twice on one screen makes the screen look like it is describing
 * two different things.
 */
function statusText({ run, elapsedMs, blockedReason }: StatusInput): string {
  if (run.status === 'running') {
    return `Running · ${formatDuration(elapsedMs)}`
  }

  if (blockedReason !== null) {
    return blockedReason
  }

  return ''
}
