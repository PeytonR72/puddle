import type { MatchNotice as Notice } from './schema-match'

/**
 * What the loaded file does not have, said once, above the query it affects.
 *
 * Not a failure and not a dialog: the query is allowed to run, and the reader
 * is the one who knows whether their export is the same data under different
 * headings. It sits above the editor rather than in the schema panel because
 * the thing it changes is what the next Run will do.
 */
export function MatchNotice({ notice }: { notice: Notice }) {
  return (
    <div className="shrink-0 border-b border-rule border-l-2 border-l-rule-strong bg-surface px-4 py-2">
      <p className="text-base text-ink">{notice.headline}</p>
      <p className="mt-1 font-sans text-small text-ink-muted">{notice.detail}</p>
    </div>
  )
}
