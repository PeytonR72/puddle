import { useCallback, useEffect, useRef, useState } from 'react'

import { ChartPanel } from '../chart/ChartPanel'
import { seedQuery } from '../query/default-query'
import type { QueryEditorHandle } from '../query/QueryEditor'
import { QueryPanel } from '../query/QueryPanel'
import { useQueryRun } from '../query/use-query-run'
import { ResultsPanel } from '../results/ResultsPanel'
import { DropZone } from './DropZone'
import { SchemaPanel } from './SchemaPanel'
import { useDataset } from './use-dataset'
import { useFileDrop } from './use-file-drop'

/**
 * The whole application, for now: a file goes in on the left and a query comes
 * out on the right — as SQL, then as rows, then as shape.
 *
 * The drop target is this element rather than the panel inside it, so a file
 * dropped anywhere lands — including on top of a dataset that is already
 * loaded, which replaces it (one file per session, per the v1 scope table).
 *
 * The query text lives here rather than inside the editor so that it survives
 * a replacement file: the panel unmounts while the new file is read, and SQL
 * somebody wrote should not go with it.
 *
 * The run lives here for a different reason: the editor and the results are two
 * views of one query, and putting it in either of them would make the other ask
 * for it back.
 */
export function Workbench() {
  const { state, progress, open, dismissFailure } = useDataset()
  const { isDraggingOver, dropHandlers } = useFileDrop(open)
  const { run, elapsedMs, start, clear } = useQueryRun()
  const [query, setQuery] = useState('')
  const editor = useRef<QueryEditorHandle | null>(null)

  const dataset = state.status === 'ready' ? state.dataset : null

  // A dataset arriving fills an empty editor with something that runs. It never
  // overwrites a query — see seedQuery.
  useEffect(() => {
    if (dataset !== null) {
      setQuery(seedQuery)
    }
  }, [dataset])

  // Rows from the file that was just replaced are not a stale view of the data,
  // they are a view of data that is no longer loaded. They go.
  useEffect(() => {
    clear()
  }, [dataset, clear])

  const insertColumn = useCallback((reference: string): void => {
    editor.current?.insertAtCursor(reference)
  }, [])

  return (
    <div className="flex h-dvh flex-col bg-paper" {...dropHandlers}>
      <header className="flex shrink-0 items-baseline gap-3 border-b border-rule px-4 py-2">
        <span className="text-base font-semibold text-ink">puddle</span>
        <span className="font-sans text-micro text-ink-faint">SQL in the browser tab</span>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        {state.status === 'ready' ? (
          <>
            <SchemaPanel dataset={state.dataset} onInsertColumn={insertColumn} onFiles={open} />

            {/* The SQL above its answer. The editor keeps a fixed share of the
                height so that running a query never moves it — the caret stays
                where it was left, whatever the result turns out to be. */}
            {/* `min-w-0` is load-bearing: a flex item sizes to its content by
                default, so a result wider than the window would stretch this
                column and take the page's horizontal scrollbar with it, instead
                of scrolling inside the grid where the sticky header can follow. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="min-h-0 shrink-0 basis-[var(--editor-height-split)]">
                <QueryPanel
                  ref={editor}
                  dataset={state.dataset}
                  value={query}
                  onChange={setQuery}
                  run={run}
                  elapsedMs={elapsedMs}
                  onRun={start}
                />
              </div>

              {/* The grid takes what is left after the editor and the chart,
                  which are both fixed. The rows are the elastic part on
                  purpose: they are the only thing here that can usefully take
                  more space when a window is taller. */}
              <div className="min-h-0 flex-1">
                <ResultsPanel run={run} />
              </div>

              <ChartPanel run={run} />
            </div>

            {isDraggingOver ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-accent bg-accent-soft/80">
                <p className="text-lead text-ink">
                  Drop to replace <span className="font-mono">{state.dataset.fileName}</span>
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <DropZone
              state={state}
              progress={progress}
              isDraggingOver={isDraggingOver}
              onFiles={open}
              onDismissFailure={dismissFailure}
            />
          </div>
        )}
      </main>
    </div>
  )
}
