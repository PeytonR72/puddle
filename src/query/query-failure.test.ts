import { describe, expect, it } from 'vitest'

import { EngineError, QueryError } from '../duckdb/client'
import { classifyQueryFailure } from './query-failure'

function refusal(message: string): QueryError {
  return new QueryError(message, { sql: 'SELECT 1' })
}

describe('classifyQueryFailure', () => {
  it('keeps DuckDB words verbatim', () => {
    const message =
      'Binder Error: Referenced column "amont" not found in FROM clause!\nCandidate bindings: "amount"'

    expect(classifyQueryFailure(refusal(message)).engineMessage).toBe(message)
  })

  it('names the kind of wrong from DuckDB own error class', () => {
    expect(classifyQueryFailure(refusal('Parser Error: syntax error at or near "FRM"')).headline).toBe(
      'That is not valid SQL.',
    )
    expect(classifyQueryFailure(refusal('Binder Error: Referenced column not found')).headline).toBe(
      'The query names a column that is not in the data.',
    )
    expect(classifyQueryFailure(refusal('Catalog Error: Table with name sales does not exist!')).headline).toBe(
      'The query names a table or function DuckDB does not have.',
    )
    expect(classifyQueryFailure(refusal('Conversion Error: Could not convert string to INTEGER')).headline).toBe(
      'A value would not convert to the type the query asked for.',
    )
    expect(classifyQueryFailure(refusal('Out of Memory Error: failed to allocate')).headline).toBe(
      'The query ran out of memory in this tab.',
    )
  })

  it('falls back to a headline that is still true when the class is unknown', () => {
    const failure = classifyQueryFailure(refusal('Constraint Error: something new'))

    expect(failure.headline).toBe('DuckDB refused the query.')
    expect(failure.engineMessage).toBe('Constraint Error: something new')
  })

  it('does not blame the SQL when the query never reached the parser', () => {
    const failure = classifyQueryFailure(new EngineError('DuckDB is not running yet.'))

    expect(failure.headline).toBe('The query never reached DuckDB.')
    expect(failure.engineMessage).toBe('DuckDB is not running yet.')
  })

  it('reads a thrown non-error', () => {
    expect(classifyQueryFailure('worker gone').engineMessage).toBe('worker gone')
  })
})
