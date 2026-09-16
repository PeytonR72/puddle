import type { EngineProgress } from '../duckdb/client'
import { SpecimenSheet } from '../landing/SpecimenSheet'
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
  /**
   * The other way in, alongside a stranger's own file. `undefined` where a
   * demo would be a wrong answer — a share link is already asking for a
   * specific file, and offering a dataset that will not match it is not a
   * second option, it is a red herring (locked decision 1's second trigger
   * is for a session with nothing else pulling on it).
   */
  onTryDemo?: (query?: string) => void
}

export function DropZone({ state, progress, isDraggingOver, onFiles, onDismissFailure, onTryDemo }: DropZoneProps) {
  // The specimen sheet is the whole surface, not a panel inside one, so it gets
  // the sheet's own padding rather than the centred column the other states use.
  if (state.status === 'empty' && onTryDemo !== undefined) {
    return (
      <div
        className={`flex min-h-full flex-col border px-7 py-8 shadow-[0_1px_0_var(--color-rule),0_14px_34px_-12px_rgb(0_0_0/0.22)] transition-colors duration-[var(--duration-surface)] ease-out sm:px-10 sm:py-10 ${
          isDraggingOver ? 'border-stamp bg-stamp-soft' : 'border-rule bg-sheet'
        }`}
      >
        <SpecimenSheet onTryDemo={onTryDemo} onFiles={onFiles} />
      </div>
    )
  }

  return (
    <div
      className={`grid-rules flex min-h-full flex-col items-center justify-center border px-6 py-16 text-center transition-colors duration-[var(--duration-surface)] ease-out ${
        isDraggingOver ? 'border-stamp bg-stamp-soft' : 'border-rule bg-sheet'
      }`}
    >
      {state.status === 'empty' ? <Invitation onFiles={onFiles} onTryDemo={onTryDemo} /> : null}
      {state.status === 'starting' ? <Starting fileName={state.fileName} progress={progress} /> : null}
      {state.status === 'reading' ? <Reading fileName={state.fileName} /> : null}
      {state.status === 'failed' ? (
        <Failed failure={state.failure} onFiles={onFiles} onDismiss={onDismissFailure} />
      ) : null}
    </div>
  )
}

function Invitation({
  onFiles,
  onTryDemo,
}: {
  onFiles: (files: readonly File[]) => void
  onTryDemo: ((query?: string) => void) | undefined
}) {
  if (onTryDemo === undefined) {
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

  return (
    <div className="flex max-w-md flex-col items-center gap-6">
      <p className="text-lead text-ink">SQL against your own file, running in this tab</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onTryDemo()}
          className="inline-flex items-center rounded-control border border-ink bg-ink px-3 py-1.5 font-mono text-base text-paper transition-colors duration-[var(--duration-fast)] ease-out hover:border-ink-muted hover:bg-ink-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          Try the demo
        </button>

        <FileButton onFiles={onFiles} variant="quiet">
          Choose a file
        </FileButton>
      </div>

      <p className="font-sans text-small text-ink-muted">
        Or drop a CSV, TSV, or Parquet file anywhere on this page. Nothing is uploaded — DuckDB reads it
        off your disk.
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
