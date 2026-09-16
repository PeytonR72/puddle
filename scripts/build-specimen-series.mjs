// Regenerates src/landing/specimen-series.ts from the bundled demo dataset.
// Run with: node scripts/build-specimen-series.mjs
import fs from 'node:fs'

const CSV = 'public/demo/coffee-shop-sales.csv'
const OUT = 'src/landing/specimen-series.ts'
const CATEGORIES = ['Coffee', 'Sandwich', 'Pastry', 'Tea']

const rows = fs.readFileSync(CSV, 'utf8').trim().split('\n').slice(1).map((line) => {
  const [date, category, revenue] = line.split(',')
  return { date, category, revenue: Number(revenue) }
})

const series = CATEGORIES.map((category) => {
  const points = rows.filter((r) => r.category === category)
  const weeks = []
  for (let i = 0; i < points.length; i += 7) {
    const week = points.slice(i, i + 7)
    weeks.push(Number((week.reduce((a, b) => a + b.revenue, 0) / week.length).toFixed(2)))
  }
  return { category, weeks }
})

const body = series.map(({ category, weeks }) =>
  `  {\n    category: '${category}',\n    weeks: [${weeks.join(', ')}],\n  },`).join('\n')

fs.writeFileSync(OUT, `/**
 * Weekly mean revenue per category, derived from public/demo/coffee-shop-sales.csv.
 *
 * Precomputed rather than queried: the specimen is drawn before a stranger has
 * asked for anything, and locked decision 1 keeps DuckDB out of the page until
 * they do. specimen-series.test.ts re-derives these from the CSV so the sheet
 * can never quietly drift from the file it claims to describe.
 *
 * Regenerate with: node scripts/build-specimen-series.mjs
 */
export type Specimen = {
  readonly category: string
  readonly weeks: readonly number[]
}

export const SPECIMEN_SERIES: readonly Specimen[] = [
${body}
]

export const SPECIMEN_ROW_COUNT = ${rows.length}
`)
console.log(`wrote ${OUT}: ${series.length} specimens, ${series[0].weeks.length} weeks each`)
