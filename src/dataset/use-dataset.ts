import { useCallback, useRef, useState } from 'react'

import type { EngineProgress } from '../duckdb/client'
import { useDuckDB, type DuckDBHandle } from '../duckdb/use-duckdb'
import { DEMO_FILE_NAME, demoFetchFailure } from './demo-dataset'
import { acceptFile, selectSingleFile } from './file-kind'
import type { FileKind } from './file-kind'
import {
  classifyIngestFailure,
  emptyFileFailure,
  engineStartFailure,
  messageOf,
  type IngestFailure,
} from './ingest-failure'
import { loadDataset, type Dataset } from './load-dataset'
import { loadDemoFile } from './load-demo-file'

/**
 * Where a load has got to.
 *
 * `starting` and `reading` are separate because they feel completely different:
 * the first is a several-megabyte download that only happens once a session and
 * has a determinate bar behind it, the second is DuckDB reading the file and
 * has no progress to report. Collapsing them into one "loading" would put a
 * stalled-looking bar in front of work that is nearly instant.
 */
export type DatasetState =
  | { status: 'empty' }
  | { status: 'starting'; fileName: string }
  | { status: 'reading'; fileName: string }
  | { status: 'ready'; dataset: Dataset }
  | { status: 'failed'; failure: IngestFailure }

export type DatasetHandle = {
  state: DatasetState
  /** Non-null only while the WASM module downloads, for the determinate bar. */
  progress: EngineProgress | null
  /** Everything a drop or a picker hands over. One of them becomes the dataset. */
  open: (files: readonly File[]) => void
  /** The other way in: Puddle's own bundled file, fetched rather than dropped. */
  openDemo: () => void
  dismissFailure: () => void
}

/**
 * Boot the engine and read a file that has already been chosen, shared by
 * `open` and `openDemo` once each has settled on a `File` and its kind — the
 * only difference between a drop and the demo is how that pair is arrived at.
 */
async function bootAndRead(
  file: File,
  kind: FileKind,
  engine: DuckDBHandle,
  isStale: () => boolean,
  fail: (failure: IngestFailure) => void,
  setState: (state: DatasetState) => void,
): Promise<void> {
  // The hook reports its own boot failure; read the resolved status rather
  // than `engine.status`, which is a render behind.
  if ((await engine.start()) !== 'ready') {
    fail(engineStartFailure(messageOf(engine.error ?? 'DuckDB did not reach a ready state.')))
    return
  }

  if (isStale()) {
    return
  }

  setState({ status: 'reading', fileName: file.name })

  try {
    const dataset = await loadDataset(file, kind)

    if (!isStale()) {
      setState({ status: 'ready', dataset })
    }
  } catch (cause) {
    fail(classifyIngestFailure(cause, { fileName: file.name, kind }))
  }
}

export function useDataset(): DatasetHandle {
  const engine = useDuckDB()
  const [state, setState] = useState<DatasetState>({ status: 'empty' })

  /**
   * Which load is the current one. Dropping a second file while the first is
   * still reading is easy to do and the slower load must not overwrite the
   * newer one when it finally lands.
   */
  const latest = useRef(0)

  const open = useCallback(
    (files: readonly File[]): void => {
      latest.current += 1
      const token = latest.current
      const isStale = (): boolean => latest.current !== token

      const fail = (failure: IngestFailure): void => {
        if (!isStale()) {
          setState({ status: 'failed', failure })
        }
      }

      const selected = selectSingleFile(files)

      if ('refusal' in selected) {
        fail({ ...selected.refusal, engineMessage: null })
        return
      }

      const { file } = selected
      const acceptance = acceptFile(file.name)

      // Both of these are settled without the engine, so a wrong file never
      // costs a stranger the WASM download before being told it is wrong.
      if (!acceptance.accepted) {
        fail({ ...acceptance.refusal, engineMessage: null })
        return
      }

      if (file.size === 0) {
        fail(emptyFileFailure(file.name))
        return
      }

      setState({ status: 'starting', fileName: file.name })
      void bootAndRead(file, acceptance.kind, engine, isStale, fail, setState)
    },
    [engine],
  )

  /**
   * The demo fetch has its own failure mode — Puddle's own bundled file not
   * coming back — that `open` never sees, so it is checked before the file
   * joins the shared boot-and-read path rather than folded into it.
   */
  const openDemo = useCallback((): void => {
    latest.current += 1
    const token = latest.current
    const isStale = (): boolean => latest.current !== token

    const fail = (failure: IngestFailure): void => {
      if (!isStale()) {
        setState({ status: 'failed', failure })
      }
    }

    setState({ status: 'starting', fileName: DEMO_FILE_NAME })

    void (async () => {
      let file: File

      try {
        file = await loadDemoFile()
      } catch (cause) {
        fail(demoFetchFailure(messageOf(cause)))
        return
      }

      if (isStale()) {
        return
      }

      await bootAndRead(file, 'csv', engine, isStale, fail, setState)
    })()
  }, [engine])

  const dismissFailure = useCallback((): void => {
    setState((current) => (current.status === 'failed' ? { status: 'empty' } : current))
  }, [])

  return { state, progress: engine.progress, open, openDemo, dismissFailure }
}
