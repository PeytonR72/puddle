/**
 * Where the SQL editor goes.
 *
 * Not a mock editor — it holds the space and proves the one wire that has to
 * exist before the editor lands: a click in the schema panel putting a column
 * name into the query. When the real editor arrives this is deleted, and the
 * panel's `onInsertColumn` points at the editor's cursor instead of at this.
 */
type EditorPlaceholderProps = {
  draft: string
  onClear: () => void
}

export function EditorPlaceholder({ draft, onClear }: EditorPlaceholderProps) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-paper">
      <div className="flex items-baseline justify-between border-b border-rule px-4 py-2">
        <span className="text-micro tracking-[0.08em] text-ink-faint uppercase">Query</span>
        {draft === '' ? null : (
          <button
            type="button"
            onClick={onClear}
            className="rounded-control px-1 font-sans text-micro text-ink-muted hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid-rules min-h-0 flex-1 overflow-auto px-4 py-3">
        {draft === '' ? (
          <p className="text-base text-ink-faint">-- Click a column to put its name here</p>
        ) : (
          <p className="text-base leading-[var(--row-height)] whitespace-pre-wrap text-ink">
            {draft}
            {/* A block where the cursor would be. Static, not blinking: this
                does not take typing yet and should not pretend to. */}
            <span className="ml-px inline-block h-[1em] w-[0.5em] translate-y-[0.15em] bg-rule-strong" />
          </p>
        )}
      </div>

      <p className="border-t border-rule px-4 py-2 font-sans text-micro text-ink-faint">
        The editor is not built yet. Column names collect here until it is.
      </p>
    </section>
  )
}
