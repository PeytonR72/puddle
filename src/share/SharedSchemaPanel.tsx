import { pluralize } from '../dataset/format'
import type { SharedQuery } from './shared-query'

/**
 * The columns a share link expects, in the place the real schema panel will
 * take once a file is loaded.
 *
 * It is the same ledger (fixed row height, hairline between rows, name and
 * type on one baseline) because it is describing the same kind of thing. The
 * one difference is that these rows do nothing when clicked: the editor beside
 * them is read-only until there is a dataset, so there is nowhere to insert a
 * name into.
 *
 * It offers no file control of its own. The drop surface below the query is
 * already asking for one, in both layouts, and two "Choose a file" buttons on
 * one screen makes a reader wonder what the difference between them is.
 */
type SharedSchemaPanelProps = {
  shared: SharedQuery
}

export function SharedSchemaPanel({ shared }: SharedSchemaPanelProps) {
  return (
    <aside className="flex max-h-[var(--panel-height-stacked)] min-h-0 w-full flex-col border-b border-rule bg-surface md:h-full md:max-h-none md:w-[var(--panel-width)] md:shrink-0 md:border-r md:border-b-0">
      <header className="border-b border-rule px-4 py-3">
        <h2 className="truncate text-base text-ink" title={shared.fileName}>
          {shared.fileName}
        </h2>
        <p className="mt-1 text-micro text-ink-muted tabular-nums">
          {pluralize(shared.schema.length, 'column', 'columns')} · shared query
        </p>
      </header>

      {/* The instruction the whole screen is built around. Sans, because a
          person is being spoken to here rather than an engine quoted. */}
      <div className="border-b border-rule border-l-2 border-l-rule-strong bg-paper px-4 py-3">
        <p className="font-sans text-small text-ink">
          Load a file with these columns to run this query.
        </p>
      </div>

      <div className="border-b border-rule px-4 py-2">
        <span className="text-micro tracking-[0.08em] text-ink-faint uppercase">
          Expected columns
        </span>
      </div>

      {shared.schema.length === 0 ? (
        <p className="px-4 py-3 font-sans text-small text-ink-muted">
          The link names no columns. Any file will do.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {shared.schema.map((column, position) => (
            // Position, not name: SQL does not promise unique column names.
            <li key={`${position}-${column.name}`} className="border-b border-rule last:border-b-0">
              <div
                title={`${column.name}: ${column.type}`}
                className="flex h-[var(--row-height)] w-full items-center gap-3 px-4"
              >
                <span className="min-w-0 flex-1 truncate text-base font-medium text-ink">
                  {column.name}
                </span>
                <span className="shrink-0 text-micro text-ink-faint">{column.type}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
