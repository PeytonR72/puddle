import { describe, expect, it } from 'vitest'

import { ACCEPT_ATTRIBUTE, acceptFile, extensionOf, selectSingleFile } from './file-kind'

describe('extensionOf', () => {
  it('reads the extension after the last dot', () => {
    expect(extensionOf('sales.csv')).toBe('csv')
    expect(extensionOf('archive.tar.parquet')).toBe('parquet')
  })

  it('lower-cases it, because an extension is not case-sensitive to a person', () => {
    expect(extensionOf('SALES.CSV')).toBe('csv')
    expect(extensionOf('Sales.Parquet')).toBe('parquet')
  })

  it('returns null when there is no extension', () => {
    expect(extensionOf('sales')).toBeNull()
    expect(extensionOf('')).toBeNull()
  })

  it('does not read a leading dot as an extension', () => {
    // `.gitignore` is a whole name. Reading `gitignore` as its extension would
    // make the refusal message name a format the user never typed.
    expect(extensionOf('.gitignore')).toBeNull()
  })

  it('returns null when the name ends in a dot', () => {
    expect(extensionOf('sales.')).toBeNull()
  })
})

describe('acceptFile', () => {
  it('accepts the three formats in the v1 scope table', () => {
    expect(acceptFile('sales.csv')).toEqual({ accepted: true, kind: 'csv' })
    expect(acceptFile('sales.tsv')).toEqual({ accepted: true, kind: 'tsv' })
    expect(acceptFile('sales.parquet')).toEqual({ accepted: true, kind: 'parquet' })
  })

  it('accepts regardless of case', () => {
    expect(acceptFile('SALES.CSV')).toEqual({ accepted: true, kind: 'csv' })
  })

  it('refuses anything else and names all three accepted formats', () => {
    const result = acceptFile('notes.docx')

    expect(result.accepted).toBe(false)

    if (!result.accepted) {
      expect(result.refusal.headline).toContain('.docx')
      expect(result.refusal.detail).toContain('.csv')
      expect(result.refusal.detail).toContain('.tsv')
      expect(result.refusal.detail).toContain('.parquet')
    }
  })

  it('refuses a file with no extension and says that is why', () => {
    const result = acceptFile('sales')

    expect(result.accepted).toBe(false)

    if (!result.accepted) {
      expect(result.refusal.headline).toContain('no file extension')
      expect(result.refusal.headline).toContain('sales')
      expect(result.refusal.detail).toContain('.csv')
    }
  })

  it('refuses a near miss rather than guessing at it', () => {
    // `.xlsx` is a table too, and guessing would hand DuckDB a zip archive.
    expect(acceptFile('sales.xlsx').accepted).toBe(false)
    expect(acceptFile('sales.json').accepted).toBe(false)
    expect(acceptFile('sales.txt').accepted).toBe(false)
  })
})

describe('ACCEPT_ATTRIBUTE', () => {
  it('is the list the file picker wants', () => {
    expect(ACCEPT_ATTRIBUTE).toBe('.csv,.tsv,.parquet')
  })
})

describe('selectSingleFile', () => {
  const named = (name: string): File => new File(['a,b\n1,2\n'], name)

  it('takes the one file it was given', () => {
    const file = named('sales.csv')

    expect(selectSingleFile([file])).toEqual({ file })
  })

  it('refuses an empty drop and suggests why it might be empty', () => {
    const result = selectSingleFile([])

    expect('refusal' in result).toBe(true)

    if ('refusal' in result) {
      expect(result.refusal.headline).toContain('no file')
      expect(result.refusal.detail).toContain('link')
    }
  })

  it('refuses several files rather than quietly loading the first', () => {
    // One file per session is the v1 scope boundary, so a three-file drop is a
    // misunderstanding to name, not one to paper over.
    const result = selectSingleFile([named('a.csv'), named('b.csv'), named('c.csv')])

    expect('refusal' in result).toBe(true)

    if ('refusal' in result) {
      expect(result.refusal.headline).toContain('one file at a time')
      expect(result.refusal.headline).toContain('3')
    }
  })
})
