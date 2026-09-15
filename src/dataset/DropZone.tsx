import type { EngineProgress } from '../duckdb/client'
import { FileButton } from './FileButton'
import { formatBytes } from './format'
import type { IngestFailure } from './ingest-failure'
import type { DatasetState } from './use-dataset'

/**
 * The surface a file arrives on, and everything that happens before a dataset
 * exists: the invitation, the DuckDB boot, the read, and the failures.
 *
 * It is the whole working area rather than a dashed rectangle inside one,
 * because until a file is loaded this screen *is* Puddle. The faint horizontal
 * rules across it are the empty result grid the file is about to fill.
 */
type DropZoneProps = {
  state: Exclude<DatasetState, { status: 'ready' }>
  progress: EngineProgress | null
  isDraggingOver: boolean
  onFiles: (files: readonly File[]) => void
  onDismissFailure: () => void
}

export function DropZone({ state, progress, isDraggingOver, onFiles, onDismissFailure }: DropZoneProps) {
  return (
    <div
      className={`grid-rules flex min-h-full flex-col items-center justify-center border px-6 py-16 text-center transition-colors duration-[var(--duration-surface)] ease-out ${
        isDraggingOver ? 'border-accent bg-accent-soft' : 'border-rule bg-paper'
      }`}
    >
      {state.status === 'empty' ? <Invitation onFiles={onFiles} /> : null}
      {state.status === 'starting' ? <Starting fileName={state.fileName} progress={progress} /> : null}
      {state.status === 'reading' ? <Reading fileName={state.fileName} /> : null}
      {state.status === 'failed' ? (
        <Failed failure={state.failure} onFiles={onFiles} onDismiss={onDismissFailure} />
      ) : null}
    </div>
  )
}

function Invitation({ onFiles }: { onFiles: (files: readonly File[]) => void }) {
  return (
    <div className="flex max-w-md flex-col items-center gap-6">
      <p className="text-lead text-ink">Drop a CSV, TSV, or Parquet file here</p>

      <FileButton onFiles={onFiles}>Choose a file</FileButton>

      <p className="font-sans text-small text-ink-muted">
        Nothing is uploaded. DuckDB runs in this tab and reads the file off your disk.
      </p>
    </div>
  )
}

/**
 * The boot. A stranger's first screen, so it reports bytes rather than
 * spinning: the download is tens of megabytes and an indeterminate spinner in
 * front of it is indistinguishable from a hang.
 */
function Starting({ fileName, progress }: { fileName: string; progress: EngineProgress | null }) {
  const ratio = progress?.ratio ?? 0

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <p className="text-lead text-ink">Starting DuckDB</p>

      <div className="w-full">
        <div
          className="h-0.5 w-full bg-rule"
          role="progressbar"
          aria-label="Starting DuckDB"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(ratio * 100)}
        >
          {/* Linear, not eased: an eased bar misreports the download rate, and
              this is the one number a stranger cannot check for themselves. */}
          <div
            className="h-0.5 bg-accent transition-[width] duration-[var(--duration-fast)] ease-linear"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>

        <p className="mt-2 text-micro text-ink-muted tabular-nums">
          {progress
            ? `${formatBytes(progress.bytesLoaded)} of ${formatBytes(progress.bytesTotal)}`
            : 'Fetching the engine'}
        </p>
      </div>

      <p className="font-sans text-small text-ink-muted">
        The engine downloads once per session. <span className="font-mono">{fileName}</span> is read
        as soon as it is ready.
      </p>
    </div>
  )
}

function Reading({ fileName }: { fileName: string }) {
  return (
    <div className="flex max-w-md flex-col items-center gap-3">
      <p className="text-lead text-ink">
        Reading <span className="text-accent">{fileName}</span>
      </p>
      <p className="font-sans text-small text-ink-muted">
        DuckDB is working out the columns and their types.
      </p>
    </div>
  )
}

function Failed({
  failure,
  onFiles,
  onDismiss,
}: {
  failure: IngestFailure
  onFiles: (files: readonly File[]) => void
  onDismiss: () => void
}) {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-5">
      <div className="w-full border-l-2 border-failed bg-failed-soft px-4 py-3 text-left">
        <p className="text-base text-failed">{failure.headline}</p>
        <p className="mt-1 font-sans text-small text-ink">{failure.detail}</p>
      </div>

      {failure.engineMessage === null ? null : (
        <details className="w-full text-left">
          <summary className="cursor-pointer text-micro tracking-[0.08em] text-ink-muted uppercase hover:text-ink">
            What DuckDB said
          </summary>
          {/* Verbatim, caret block and all. It is long, which is why it is
              behind a disclosure rather than thrown away. */}
          <pre className="mt-2 max-h-56 overflow-auto border border-rule bg-surface p-3 text-micro leading-relaxed whitespace-pre-wrap text-ink-muted">
            {failure.engineMessage}
          </pre>
        </details>
      )}

      <div className="flex items-center gap-3">
        <FileButton onFiles={onFiles}>Choose another file</FileButton>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-control border border-rule-strong bg-paper px-3 py-1.5 font-mono text-base text-ink transition-colors duration-[var(--duration-fast)] ease-out hover:border-ink-muted hover:bg-surface"
        >
          Start over
        </button>
      </div>
    </div>
  )
}
