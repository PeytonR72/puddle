import { useEffect, useId, useState } from 'react'

import { shareLinkFor } from './share-link'
import type { SharedQuery } from './shared-query'

/**
 * Puts the query (and only the query) on the clipboard.
 *
 * The label is the feedback. A toast for a thing this small would arrive after
 * the eye has already left the button, and the button is the element that was
 * just pressed, so it is the one place the answer is certainly read.
 */
type CopyLinkButtonProps = {
  /** `null` disables the control: there is nothing worth sharing yet. */
  shared: SharedQuery | null
}

/** How long "Copied" stays before the button offers itself again. */
const REVERT_MS = 1600

type CopyState = 'idle' | 'copied' | 'failed'

const LABELS: Record<CopyState, string> = {
  idle: 'Copy share link',
  copied: 'Copied',
  failed: 'Copy failed',
}

/** Why the button is off, which is the only state it has that needs explaining. */
const REASON = 'Run a query first. The link carries the query and the column names, never the data.'

export function CopyLinkButton({ shared }: CopyLinkButtonProps) {
  const [copy, setCopy] = useState<CopyState>('idle')
  const reasonId = useId()

  useEffect(() => {
    if (copy === 'idle') {
      return
    }

    const timer = window.setTimeout(() => setCopy('idle'), REVERT_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [copy])

  const onCopy = (): void => {
    if (shared === null) {
      return
    }

    try {
      // `navigator.clipboard` is absent outside a secure context, and the write
      // is refused if the page has lost focus. Both land as "Copy failed"
      // rather than as nothing happening.
      void navigator.clipboard.writeText(shareLinkFor(window.location.href, shared)).then(
        () => setCopy('copied'),
        () => setCopy('failed'),
      )
    } catch {
      setCopy('failed')
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* `aria-disabled` rather than `disabled`: the reason this control is off
          is worth hearing, and a disabled button cannot be focused to hear it.
          The click is what actually stops. */}
      <button
        type="button"
        onClick={onCopy}
        aria-disabled={shared === null}
        aria-describedby={shared === null ? reasonId : undefined}
        title={shared === null ? REASON : undefined}
        className="inline-flex h-11 shrink-0 items-center rounded-control border border-rule-strong bg-paper px-3 font-mono text-base text-ink transition-colors duration-[var(--duration-fast)] ease-out hover:border-ink-muted hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent aria-disabled:cursor-not-allowed aria-disabled:border-rule aria-disabled:bg-surface aria-disabled:text-ink-faint aria-disabled:hover:border-rule aria-disabled:hover:bg-surface md:h-8"
      >
        {LABELS[copy]}
      </button>

      {shared === null ? (
        <p id={reasonId} className="sr-only">
          {REASON}
        </p>
      ) : null}

      {/* Said out loud once, on the press, because the label itself changes too
          quietly for a screen reader to catch it in passing. */}
      <p aria-live="polite" className="sr-only">
        {copy === 'idle' ? '' : LABELS[copy]}
      </p>
    </div>
  )
}
