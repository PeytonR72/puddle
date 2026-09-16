import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ChartPanel } from '../chart/ChartPanel'
import { DEFAULT_QUERY, seedQuery } from '../query/default-query'
import type { QueryEditorHandle } from '../query/QueryEditor'
import { QueryPanel } from '../query/QueryPanel'
import { useQueryRun } from '../query/use-query-run'
import { ResultsPanel } from '../results/ResultsPanel'
import { CopyLinkButton } from '../share/CopyLinkButton'
import { MatchNotice } from '../share/MatchNotice'
import { matchNotice, matchSchema } from '../share/schema-match'
import { SharedSchemaPanel } from '../share/SharedSchemaPanel'
import { sharedQueryFor } from '../share/shared-query'
import { useSharedQuery } from '../share/use-shared-query'
import { DropZone } from './DropZone'
import type { Dataset } from './load-dataset'
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
 *
 * A share link arrives as a third source of query text, and the only one that
 * exists before the first render — so it seeds the editor rather than being
 * written into it later.
 */
export function Workbench() {
  const shared = useSharedQuery()
  const { state, progress, open, openDemo, dismissFailure } = useDataset()
  const { isDraggingOver, dropHandlers } = useFileDrop(open)
  const { run, elapsedMs, start, clear } = useQueryRun()
  const [query, setQuery] = useState(shared?.query ?? '')
  const editor = useRef<QueryEditorHandle | null>(null)

  const dataset = state.status === 'ready' ? state.dataset : null

  // Whether the file that just loaded is the shape the link was written
  // against. `null` for an ordinary session, which has nothing to compare to.
  const match = useMemo(
    () => (shared === null || dataset === null ? null : matchSchema(shared.schema, dataset.columns)),
    [shared, dataset],
  )

  // A dataset arriving fills an empty editor with something that runs. It never
  // overwrites a query — see seedQuery, which is what keeps a shared one.
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

  /**
   * A shared query runs itself once the file it needs is loaded.
   *
   * Somebody who opened this link came for an answer, and asking them to press
   * Run on a query they did not write — against a file they were just told to
   * find — is a step with no decision in it. Only on an exact match: a file
   * missing columns might fail, and a failure nobody asked for reads as the
   * link being broken.
   */
  const autoRan = useRef<Dataset | null>(null)

  useEffect(() => {
    if (shared === null || dataset === null || match?.status !== 'matched') {
      return
    }

    if (autoRan.current === dataset) {
      return
    }

    autoRan.current = dataset
    start(shared.query)
  }, [shared, dataset, match, start])

  /**
   * The demo runs itself for the same reason a matched share link does: the
   * whole point of the button was to skip typing SQL, so a reader who presses
   * it and lands on an editor waiting for Run has been handed a second task
   * they did not ask for.
   */
  const demoRequested = useRef(false)
  const autoRanDemo = useRef<Dataset | null>(null)

  const tryDemo = useCallback((): void => {
    demoRequested.current = true
    openDemo()
  }, [openDemo])

  useEffect(() => {
    if (!demoRequested.current || dataset === null || autoRanDemo.current === dataset) {
      return
    }

    autoRanDemo.current = dataset
    demoRequested.current = false
    start(DEFAULT_QUERY)
  }, [dataset, start])

  /**
   * What a link copied right now would carry: the SQL in the editor, not the
   * SQL that last ran. Sharing what is on screen is the only version that can
   * be checked before the button is pressed.
   */
  const sharePayload = useMemo(
    () =>
      dataset === null || run.status !== 'succeeded'
        ? null
        : sharedQueryFor({ query, fileName: dataset.fileName, columns: dataset.columns }),
    [dataset, run.status, query],
  )

  const insertColumn = useCallback((reference: string): void => {
    editor.current?.insertAtCursor(reference)
  }, [])

  const notice = match === null || dataset === null ? null : matchNotice(match, dataset.fileName)

  /**
   * The specimen sheet carries the wordmark itself, at the size a sheet prints
   * its collection's name. Running the app header above it would put a second
   * `puddle` on the same screen — so on the first viewport the sheet is the
   * page, and the working chrome arrives with the dataset it describes.
   */
  const showingSheet = state.status === 'empty' && shared === null

  return (
    <div
      className={`flex h-dvh flex-col ${showingSheet ? 'bg-mount' : 'bg-paper'}`}
      {...dropHandlers}
    >
      {showingSheet ? null : (
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-rule px-4 py-2">
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="font-display text-body leading-none font-bold tracking-[-0.02em] text-ink">
              puddle
            </span>
            <span className="truncate font-sans text-micro tracking-[0.12em] text-ink-faint uppercase">
              {dataset === null ? 'SQL in the browser tab' : dataset.fileName}
            </span>
          </div>

          {/* Only once there is a dataset. Before that the control has nothing to
              describe, and a stranger's first screen is not the place for a
              button that cannot be pressed. */}
          {dataset === null ? null : <CopyLinkButton shared={sharePayload} />}
        </header>
      )}

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
              {notice === null ? null : <MatchNotice notice={notice} />}

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
        ) : shared === null ? (
          /* The sheet sits on its mount with real space around it and a lift
             that has an offset and a blur, so it reads as an object resting on
             a darker ground rather than as a page with a border. */
          <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-8">
            <DropZone
              state={state}
              progress={progress}
              isDraggingOver={isDraggingOver}
              onFiles={open}
              onDismissFailure={dismissFailure}
              onTryDemo={tryDemo}
            />
          </div>
        ) : (
          /* A share link with no file yet: the query read-only beside the
             columns it expects (locked decision 4). The drop surface takes the
             results' place rather than the whole screen, which says where the
             answer is going to land without hiding the question. */
          <>
            <SharedSchemaPanel shared={shared} />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="min-h-0 shrink-0 basis-[var(--editor-height-split)]">
                <QueryPanel
                  ref={editor}
                  dataset={null}
                  value={query}
                  onChange={setQuery}
                  run={run}
                  elapsedMs={elapsedMs}
                  onRun={start}
                />
              </div>

              <div className="min-h-0 flex-1 overflow-auto p-4">
                <DropZone
                  state={state}
                  progress={progress}
                  isDraggingOver={isDraggingOver}
                  onFiles={open}
                  onDismissFailure={dismissFailure}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
