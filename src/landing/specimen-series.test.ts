import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

import { SPECIMEN_ROW_COUNT, SPECIMEN_SERIES } from './specimen-series'

const CSV = 'public/demo/coffee-shop-sales.csv'

type Row = { date: string; category: string; revenue: number }

function readRows(): Row[] {
  return fs
    .readFileSync(CSV, 'utf8')
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => {
      const [date, category, revenue] = line.split(',')
      if (date === undefined || category === undefined || revenue === undefined) {
        throw new Error(`malformed row: ${line}`)
      }
      return { date, category, revenue: Number(revenue) }
    })
}

function weeklyMeans(rows: readonly Row[], category: string): number[] {
  const points = rows.filter((r) => r.category === category)
  const weeks: number[] = []
  for (let i = 0; i < points.length; i += 7) {
    const week = points.slice(i, i + 7)
    weeks.push(Number((week.reduce((a, b) => a + b.revenue, 0) / week.length).toFixed(2)))
  }
  return weeks
}

describe('specimen series', () => {
  const rows = readRows()

  it('counts the rows the determination label claims', () => {
    expect(SPECIMEN_ROW_COUNT).toBe(rows.length)
  })

  it('covers every category in the file, and no others', () => {
    const inFile = [...new Set(rows.map((r) => r.category))].sort()
    const drawn = SPECIMEN_SERIES.map((s) => s.category).sort()
    expect(drawn).toEqual(inFile)
  })

  // The sheet is a claim about a specific file. If the file is replaced and the
  // series is not regenerated, the traces become decoration — this is the test
  // that refuses to let that ship.
  it.each(SPECIMEN_SERIES.map((s) => s.category))('matches the file for %s', (category) => {
    const specimen = SPECIMEN_SERIES.find((s) => s.category === category)
    expect(specimen?.weeks).toEqual(weeklyMeans(rows, category))
  })

  it('gives every specimen a range worth drawing', () => {
    for (const { category, weeks } of SPECIMEN_SERIES) {
      expect(weeks.length, category).toBeGreaterThan(8)
      expect(Math.max(...weeks), category).toBeGreaterThan(Math.min(...weeks))
    }
  })
})
