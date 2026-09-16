import { useCallback, useEffect, useRef, useState } from 'react'

import { seedQuery } from '../query/default-query'
import type { QueryEditorHandle } from '../query/QueryEditor'
import { QueryPanel } from '../query/QueryPanel'
import { DropZone } from './DropZone'
import { SchemaPanel } from './SchemaPanel'
import { useDataset } from './use-dataset'
import { useFileDrop } from './use-file-drop'

/**
 * The whole application, for now: a file goes in on the left and a query comes
 * out on the right.
 *
 * The drop target is this element rather than the panel inside it, so a file
 * dropped anywhere lands — including on top of a dataset that is already
 * loaded, which replaces it (one file per session, per the v1 scope table).
 *
 * The query text lives here rather than inside the editor so that it survives
 * a replacement file: the panel unmounts while the new file is read, and SQL
 * somebody wrote should not go with it.
 */
export function Workbench() {
  const { state, progress, open, dismissFailure } = useDataset()
  const { isDraggingOver, dropHandlers } = useFileDrop(open)
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
            <div className="min-h-0 flex-1">
              <QueryPanel ref={editor} dataset={state.dataset} value={query} onChange={setQuery} />
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
