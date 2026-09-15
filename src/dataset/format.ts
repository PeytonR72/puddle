/**
 * Counts, as the schema panel says them out loud.
 *
 * Grouped digits because a row count is read at a glance and `1428` reads as a
 * year. Singular where singular is correct, because "1 rows" is the detail that
 * tells a reader nobody looked at this screen.
 */

const GROUPED = new Intl.NumberFormat('en-US')

export function formatCount(value: number): string {
  return GROUPED.format(value)
}

export function pluralize(value: number, singular: string, plural: string): string {
  return `${formatCount(value)} ${value === 1 ? singular : plural}`
}

/**
 * A file size, in the units a person would use for it.
 *
 * Decimal units, not binary: a browser reports a 1,500,000-byte file as 1.5MB
 * and matching that is worth more than being right about mebibytes.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1_000) {
    return `${formatCount(bytes)}B`
  }

  if (bytes < 1_000_000) {
    return `${(bytes / 1_000).toFixed(0)}KB`
  }

  return `${(bytes / 1_000_000).toFixed(1)}MB`
}
