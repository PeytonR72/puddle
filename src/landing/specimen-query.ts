import { weekStartDate } from './specimen-geometry'

/**
 * The SQL a specimen reading stands for.
 *
 * Activating a point on the sheet is meant to hand the reader the query that
 * produced it, which is what makes the landing surface the query builder rather
 * than a picture of one. The week is a half-open range: `>= start` and
 * `< start + 7 days`, so consecutive weeks tile without double-counting the
 * boundary day.
 */
const DAYS_IN_WEEK = 7

export function specimenQuery(category: string, weekIndex: number, firstDate: string): string {
  const start = weekStartDate(firstDate, weekIndex)
  const end = weekStartDate(firstDate, weekIndex + 1)

  return [
    'SELECT date, category, revenue',
    'FROM dataset',
    `WHERE category = ${quote(category)}`,
    `  AND date >= ${quote(start)}`,
    `  AND date < ${quote(end)}`,
    'ORDER BY date',
  ].join('\n')
}

/**
 * A category name arrives from the file, so it is data rather than something
 * this module authored. Doubling the quote is what SQL itself specifies, and it
 * keeps a name like `Bob's` from ending the literal early.
 */
function quote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

export { DAYS_IN_WEEK }
