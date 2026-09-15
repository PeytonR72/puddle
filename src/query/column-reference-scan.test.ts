import { describe, expect, it } from 'vitest'

import { columnNameKeys, findColumnReferences, type ColumnReferenceRange } from './column-reference-scan'

const COLUMNS = columnNameKeys(['amount', 'Region', 'Total Sales', 'order'])

/** The substrings a run of the scanner marked, which is what the reader sees. */
function marked(sql: string, columns: ReadonlySet<string> = COLUMNS): string[] {
  return findColumnReferences(sql, columns).map(({ from, to }: ColumnReferenceRange) =>
    sql.slice(from, to),
  )
}

describe('columnNameKeys', () => {
  it('lower-cases, because DuckDB matches identifiers case-insensitively', () => {
    expect(columnNameKeys(['Region', 'AMOUNT'])).toEqual(new Set(['region', 'amount']))
  })
})

describe('findColumnReferences', () => {
  it('marks a bare column name', () => {
    expect(marked('SELECT amount FROM data')).toEqual(['amount'])
  })

  it('marks a name whatever case it is written in', () => {
    expect(marked('SELECT AMOUNT, region FROM data')).toEqual(['AMOUNT', 'region'])
  })

  it('marks a quoted name, quotes included', () => {
    expect(marked('SELECT "Total Sales" FROM data')).toEqual(['"Total Sales"'])
  })

  it('marks a quoted name that had to be quoted for being a keyword', () => {
    expect(marked('SELECT "order" FROM data')).toEqual(['"order"'])
  })

  it('reads a doubled quote inside an identifier as one quote', () => {
    const columns = columnNameKeys(['we"ird'])

    expect(marked('SELECT "we""ird" FROM data', columns)).toEqual(['"we""ird"'])
  })

  it('leaves alone a word that is not a column', () => {
    expect(marked('SELECT total FROM data')).toEqual([])
  })

  it('leaves alone a keyword that shares no name with a column', () => {
    expect(marked('SELECT * FROM data LIMIT 100')).toEqual([])
  })

  it('does not reach inside a string literal', () => {
    expect(marked("SELECT 'amount' FROM data")).toEqual([])
  })

  it('keeps scanning after a string literal that contains a doubled quote', () => {
    expect(marked("SELECT 'it''s amount', amount FROM data")).toEqual(['amount'])
  })

  it('does not reach inside a dollar-quoted string', () => {
    expect(marked('SELECT $$amount$$, amount FROM data')).toEqual(['amount'])
  })

  it('does not reach inside a line comment', () => {
    expect(marked('-- amount goes here\nSELECT amount FROM data')).toEqual(['amount'])
  })

  it('does not reach inside a block comment, including across lines', () => {
    expect(marked('SELECT /* not\n amount \n*/ region FROM data')).toEqual(['region'])
  })

  it('treats an unterminated comment as running to the end', () => {
    expect(marked('SELECT amount FROM data /* region')).toEqual(['amount'])
  })

  it('marks a column qualified by the view name', () => {
    expect(marked('SELECT data.amount FROM data')).toEqual(['amount'])
  })

  it('does not find an identifier inside a number', () => {
    const columns = columnNameKeys(['e5'])

    expect(marked('SELECT 1e5 FROM data', columns)).toEqual([])
  })

  it('reports ranges that index back into the source', () => {
    const sql = 'SELECT amount FROM data'

    expect(findColumnReferences(sql, COLUMNS)).toEqual([{ from: 7, to: 13 }])
  })

  it('finds every occurrence, in the order they are written', () => {
    expect(marked('SELECT amount, region, amount FROM data')).toEqual([
      'amount',
      'region',
      'amount',
    ])
  })

  it('does no work when the dataset has no columns', () => {
    expect(marked('SELECT amount FROM data', columnNameKeys([]))).toEqual([])
  })
})
