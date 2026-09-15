import { useId, type ReactNode } from 'react'

import { ACCEPT_ATTRIBUTE } from './file-kind'

/**
 * Click-to-browse, as a styled label in front of a real file input.
 *
 * A bare `<input type="file">` cannot be styled and renders as "No file chosen"
 * beside a grey button; a `<div>` wired to `.click()` loses the keyboard. The
 * input stays as the thing the browser and assistive tech operate — `sr-only`
 * rather than `display: none`, so it is still focusable — and the label carries
 * the styling, including the focus ring the input would otherwise take
 * invisibly.
 */
type FileButtonProps = {
  onFiles: (files: readonly File[]) => void
  children: ReactNode
  variant?: 'primary' | 'quiet'
}

const VARIANTS = {
  primary: 'border-ink bg-ink text-paper hover:border-ink-muted hover:bg-ink-muted',
  quiet: 'border-rule-strong bg-paper text-ink hover:border-ink-muted hover:bg-surface',
} as const

export function FileButton({ onFiles, children, variant = 'primary' }: FileButtonProps) {
  const id = useId()

  return (
    <span className="inline-flex">
      <input
        id={id}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="peer sr-only"
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []))
          // Cleared so choosing the same file twice in a row still fires a
          // change event — otherwise retrying after a failure does nothing.
          event.target.value = ''
        }}
      />
      <label
        htmlFor={id}
        className={`inline-flex cursor-pointer items-center rounded-control border px-3 py-1.5 font-mono text-base transition-colors duration-[var(--duration-fast)] ease-out peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-accent ${VARIANTS[variant]}`}
      >
        {children}
      </label>
    </span>
  )
}
