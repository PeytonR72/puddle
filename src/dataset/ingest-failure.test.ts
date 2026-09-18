import { describe, expect, it } from 'vitest'

import { classifyIngestFailure, emptyFileFailure, engineStartFailure, messageOf } from './ingest-failure'

/**
 * Captured from DuckDB v1.5.4 running in Chromium, not written from memory.
 * If these stop matching a future bundle, the classifier is what needs the fix.
 */
const SNIFFER_FAILURE = `Invalid Input Error: Error when sniffing file "garbage.csv".
It was not possible to automatically detect the CSV parsing dialect
The search space used was:
Delimiter Candidates: ',', '|', ';', '\t'
Possible fixes:
* Set delimiter (e.g., delim=',')

LINE 1: CREATE OR REPLACE VIEW data AS SELECT * FROM read_csv_auto('garbage.csv')
                                                     ^`

const PARQUET_TRAPS = [
  'table index is out of bounds',
  'memory access out of bounds',
  'null function or function signature mismatch',
]

const PARQUET_EXTENSION_BLOCKED =
  "Failed to execute 'send' on 'XMLHttpRequest': Failed to load 'https://extensions.duckdb.org/v1.5.4/wasm_eh/parquet.duckdb_extension.wasm'."

describe('messageOf', () => {
  it('takes an Error at its word', () => {
    expect(messageOf(new Error('boom'))).toBe('boom')
  })

  it('passes a string through', () => {
    expect(messageOf('boom')).toBe('boom')
  })

  it('stringifies anything else rather than losing it', () => {
    expect(messageOf(42)).toBe('42')
    expect(messageOf(null)).toBe('null')
  })
})

describe('emptyFileFailure', () => {
  it('names the file and says it is empty', () => {
    const failure = emptyFileFailure('sales.csv')

    expect(failure.headline).toContain('sales.csv')
    expect(failure.headline).toContain('empty')
    expect(failure.detail).toContain('no bytes')
  })

  it('carries no engine message, because DuckDB never saw the file', () => {
    // An empty file is caught before the engine boots: DuckDB reads zero bytes
    // as one VARCHAR column and no rows, and never raises anything.
    expect(emptyFileFailure('sales.csv').engineMessage).toBeNull()
  })
})

describe('engineStartFailure', () => {
  it('says the engine did not start and keeps the reason', () => {
    const failure = engineStartFailure('WebAssembly.instantiate failed')

    expect(failure.headline).toContain('DuckDB did not start')
    expect(failure.engineMessage).toBe('WebAssembly.instantiate failed')
  })
})

describe('classifyIngestFailure: CSV and TSV', () => {
  it('explains a sniffer failure without reprinting twenty lines of candidates', () => {
    const failure = classifyIngestFailure(new Error(SNIFFER_FAILURE), {
      fileName: 'garbage.csv',
      kind: 'csv',
    })

    expect(failure.headline).toContain('garbage.csv')
    expect(failure.headline).toContain('could not work out how')
    expect(failure.detail).toContain('separator')
    // DuckDB's own text survives, for the disclosure: it is genuinely useful.
    expect(failure.engineMessage).toBe(SNIFFER_FAILURE)
  })

  it('tells a TSV reader that the extension chose the separator', () => {
    const failure = classifyIngestFailure(new Error(SNIFFER_FAILURE), {
      fileName: 'garbage.tsv',
      kind: 'tsv',
    })

    expect(failure.detail).toContain('tab-separated')
    expect(failure.detail).toContain('.tsv')
    // Naming the other delimiters would be a lie: a .tsv is read with delim='\t'.
    expect(failure.detail).not.toContain('semicolon')
  })

  it('separates a value that would not convert from a dialect it could not find', () => {
    const failure = classifyIngestFailure(
      new Error('Conversion Error: CSV Error on Line: 412\nCould not convert string "n/a" to INT64'),
      { fileName: 'sales.csv', kind: 'csv' },
    )

    expect(failure.headline).toContain('did not fit the column')
    expect(failure.detail).toContain('first rows')
  })

  it('falls back to DuckDB rather than inventing an explanation', () => {
    const failure = classifyIngestFailure(new Error('Some brand new DuckDB error'), {
      fileName: 'sales.csv',
      kind: 'csv',
    })

    expect(failure.headline).toContain('sales.csv')
    expect(failure.engineMessage).toBe('Some brand new DuckDB error')
  })

  it('does not read a WebAssembly trap as a Parquet problem on a CSV', () => {
    // The traps are how a missing Parquet extension surfaces, but they are not
    // Parquet-specific: only the file kind makes them mean that.
    const failure = classifyIngestFailure(new Error('memory access out of bounds'), {
      fileName: 'sales.csv',
      kind: 'csv',
    })

    expect(failure.headline).not.toContain('Parquet')
  })
})

describe('classifyIngestFailure: Parquet', () => {
  it.each(PARQUET_TRAPS)('reads the trap %o as the missing extension it is', (trap) => {
    const failure = classifyIngestFailure(new Error(trap), {
      fileName: 'sales.parquet',
      kind: 'parquet',
    })

    expect(failure.headline).toContain('cannot read Parquet')
    expect(failure.detail).toContain('separate extension')
    // The one thing a reader can act on today.
    expect(failure.detail).toContain('CSV and TSV')
  })

  it('reads a blocked extension download the same way', () => {
    const failure = classifyIngestFailure(new Error(PARQUET_EXTENSION_BLOCKED), {
      fileName: 'sales.parquet',
      kind: 'parquet',
    })

    expect(failure.headline).toContain('cannot read Parquet')
    expect(failure.engineMessage).toBe(PARQUET_EXTENSION_BLOCKED)
  })

  it('blames the file when the engine got far enough to read one', () => {
    const failure = classifyIngestFailure(
      new Error('Invalid Input Error: No magic bytes found at end of file'),
      { fileName: 'sales.parquet', kind: 'parquet' },
    )

    expect(failure.headline).toContain('could not read "sales.parquet" as Parquet')
    expect(failure.detail).toContain('footer')
  })
})
