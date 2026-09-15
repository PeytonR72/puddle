/**
 * The keyboard shortcut for Run, written the way this machine writes it.
 *
 * Both Cmd+Enter and Ctrl+Enter run the query everywhere — the binding is not
 * platform-dependent, only the label is. Showing a Mac reader `Ctrl+↵` would be
 * true and still wrong: it is not the key they will reach for.
 */

/** `navigator.platform` is deprecated, so this reads the user agent instead. */
export function isApplePlatform(userAgent: string): boolean {
  return /Mac|iPhone|iPad|iPod/.test(userAgent)
}

export function runShortcutLabel(userAgent: string): string {
  return isApplePlatform(userAgent) ? '⌘↵' : 'Ctrl+↵'
}
