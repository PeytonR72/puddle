import { columnReference } from './column-reference'
import { FileButton } from './FileButton'
import { pluralize } from './format'
import type { Dataset } from './load-dataset'
import { schemaNotice } from './schema-notice'

/**
 * The loaded dataset, as a ruled ledger of columns.
 *
 * A schema is a small result set, so it is drawn like one: fixed row height,
 * hairline between rows, name and type on one baseline. DuckDB's own type names
 * are shown verbatim — `BIGINT`, not "number" — because that is the vocabulary
 * the query the reader is about to write will be checked against.
 */
type SchemaPanelProps = {
  dataset: Dataset
  onInsertColumn: (reference: string) => void
  onFiles: (files: readonly File[]) => void
}

export function SchemaPanel({ dataset, onInsertColumn, onFiles }: SchemaPanelProps) {
  const notice = schemaNotice(dataset.columns)

  return (
    /* Stacked above the editor on a phone, beside it on a pointer layout. The
       stacked height is capped so a wide schema cannot push the editor off the
       screen — the query is what someone came here to write. */
    <aside className="flex max-h-[var(--panel-height-stacked)] min-h-0 w-full flex-col border-b border-rule bg-surface md:h-full md:max-h-none md:w-[var(--panel-width)] md:shrink-0 md:border-r md:border-b-0">
      <header className="border-b border-rule px-4 py-3">
        <h2 className="truncate text-base text-ink" title={dataset.fileName}>
          {dataset.fileName}
        </h2>
        <p className="mt-1 text-micro text-ink-muted tabular-nums">
          {pluralize(dataset.rowCount, 'row', 'rows')} ·{' '}
          {pluralize(dataset.columns.length, 'column', 'columns')}
        </p>
      </header>

      {/* The file loaded, so this is not a failure — but it is the shape a
          mis-read CSV takes, and only the reader can tell the two apart. */}
      {notice === null ? null : (
        <div className="border-b border-rule border-l-2 border-l-rule-strong bg-paper px-4 py-2">
          <p className="text-micro text-ink">{notice.headline}</p>
          <p className="mt-1 font-sans text-micro text-ink-muted">{notice.detail}</p>
        </div>
      )}

      <div className="flex items-baseline justify-between border-b border-rule px-4 py-2">
        <span className="text-micro tracking-[0.08em] text-ink-faint uppercase">Columns</span>
        <span className="font-sans text-micro text-ink-faint">click to insert</span>
      </div>

      {dataset.columns.length === 0 ? (
        <p className="px-4 py-3 font-sans text-small text-ink-muted">
          DuckDB read the file but found no columns in it.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {dataset.columns.map((column, position) => (
            // Position, not name: SQL does not promise unique column names, and
            // `SELECT 1 AS a, 2 AS a` really does return two columns called `a`.
            <li key={`${position}-${column.name}`} className="border-b border-rule last:border-b-0">
              <button
                type="button"
                onClick={() => onInsertColumn(columnReference(column.name))}
                title={`${column.name} — ${column.type}`}
                className="flex h-[var(--row-height)] w-full items-center gap-3 px-4 text-left hover:bg-paper"
              >
                <span className="min-w-0 flex-1 truncate text-base font-medium text-ink">
                  {column.name}
                </span>
                <span className="shrink-0 text-micro text-ink-faint">{column.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="border-t border-rule px-4 py-3">
        <FileButton onFiles={onFiles} variant="quiet">
          Replace dataset
        </FileButton>
      </footer>
    </aside>
  )
}
