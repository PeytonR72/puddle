/**
 * How long a query took, or how long it has been going.
 *
 * One formatter for both, because they are the same number read at two moments
 * and a reader should not have to re-learn the units when the query finishes.
 *
 * Sub-millisecond durations round to `0ms` rather than growing decimals. DuckDB
 * really does answer a small aggregate that fast, and `0.43ms` claims a
 * precision that `performance.now()` does not have in a cross-origin-isolated
 * tab we deliberately do not have (locked decision 2).
 */

/** Minutes only show up when a query has genuinely run away with itself. */
const MINUTE = 60_000

export function formatDuration(ms: number): string {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0

  if (safe < 1_000) {
    return `${Math.round(safe)}ms`
  }

  if (safe < MINUTE) {
    return `${(safe / 1_000).toFixed(1)}s`
  }

  const minutes = Math.floor(safe / MINUTE)
  const seconds = Math.floor((safe % MINUTE) / 1_000)

  return `${minutes}m ${seconds}s`
}
