import { describe, expect, it } from 'vitest'

import { countRowsSql, createViewSql, DATASET_VIEW, quoteStringLiteral } from './ingest-sql'

describe('quoteStringLiteral', () => {
  it('wraps a plain name in single quotes', () => {
    expect(quoteStringLiteral('sales.csv')).toBe("'sales.csv'")
  })

  it('doubles a single quote so the literal does not end early', () => {
    expect(quoteStringLiteral("we'ird.csv")).toBe("'we''ird.csv'")
  })

  it('leaves a double quote alone, because a literal is not an identifier', () => {
    expect(quoteStringLiteral('we"ird.csv')).toBe('\'we"ird.csv\'')
  })

  it('handles a name that is nothing but quotes', () => {
    expect(quoteStringLiteral("'''")).toBe("''''''''")
  })
})

describe('createViewSql', () => {
  it('always names the view `data`, whatever the file is called', () => {
    // Portability of a query across datasets is what makes a share link work.
    expect(createViewSql('csv', 'anything.csv')).toContain(`VIEW ${DATASET_VIEW} AS`)
    expect(createViewSql('parquet', 'other.parquet')).toContain(`VIEW ${DATASET_VIEW} AS`)
  })

  it('reads a CSV with the sniffer', () => {
    expect(createViewSql('csv', 'sales.csv')).toBe(
      "CREATE OR REPLACE VIEW data AS SELECT * FROM read_csv_auto('sales.csv')",
    )
  })

  it('tells the sniffer the delimiter for a TSV', () => {
    // The extension already answered the question the sniffer would guess at.
    expect(createViewSql('tsv', 'sales.tsv')).toBe(
      "CREATE OR REPLACE VIEW data AS SELECT * FROM read_csv_auto('sales.tsv', delim='\t')",
    )
  })

  it('reads a Parquet file with read_parquet', () => {
    expect(createViewSql('parquet', 'sales.parquet')).toBe(
      "CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('sales.parquet')",
    )
  })

  it('replaces rather than errors, because a session holds one file', () => {
    expect(createViewSql('csv', 'sales.csv')).toContain('CREATE OR REPLACE VIEW')
  })

  it('escapes a quote in the file name', () => {
    expect(createViewSql('csv', "we'ird.csv")).toBe(
      "CREATE OR REPLACE VIEW data AS SELECT * FROM read_csv_auto('we''ird.csv')",
    )
  })
})

describe('countRowsSql', () => {
  it('counts the view, not the file', () => {
    expect(countRowsSql()).toBe('SELECT count(*) AS row_count FROM data')
  })
})
