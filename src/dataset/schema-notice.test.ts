import { describe, expect, it } from 'vitest'

import type { Column } from '../duckdb/client'
import { schemaNotice } from './schema-notice'

const column = (name: string): Column => ({ name, type: 'VARCHAR', kind: 'string' })

describe('schemaNotice', () => {
  it('says nothing about a schema with real column names', () => {
    expect(schemaNotice([column('order_id'), column('region')])).toBeNull()
  })

  it('reports a fully numbered schema, which is how a wrong separator looks', () => {
    // Verified against DuckDB: ragged rows load as numbered columns and no error.
    const notice = schemaNotice([column('column0'), column('column1'), column('column2')])

    expect(notice?.headline).toBe('No header row.')
    expect(notice?.detail).toContain('separator')
  })

  it('reports a single numbered column too', () => {
    expect(schemaNotice([column('column0')])).not.toBeNull()
  })

  it('stays quiet when only some columns are numbered', () => {
    // A real file can carry a column called `column0`; only the whole set being
    // numbered means DuckDB found no header.
    expect(schemaNotice([column('order_id'), column('column1')])).toBeNull()
  })

  it('stays quiet when the numbering does not line up with position', () => {
    expect(schemaNotice([column('column1'), column('column2')])).toBeNull()
  })

  it('stays quiet about no columns at all', () => {
    // The panel has its own line for that case.
    expect(schemaNotice([])).toBeNull()
  })
})
