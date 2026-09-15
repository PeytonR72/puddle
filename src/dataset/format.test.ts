import { describe, expect, it } from 'vitest'

import { formatBytes, formatCount, pluralize } from './format'

describe('formatCount', () => {
  it('groups digits, because a bare 1428 reads as a year', () => {
    expect(formatCount(1428)).toBe('1,428')
    expect(formatCount(1_000_000)).toBe('1,000,000')
  })

  it('leaves small numbers alone', () => {
    expect(formatCount(0)).toBe('0')
    expect(formatCount(12)).toBe('12')
  })
})

describe('pluralize', () => {
  it('says "1 row", not "1 rows"', () => {
    expect(pluralize(1, 'row', 'rows')).toBe('1 row')
    expect(pluralize(1, 'column', 'columns')).toBe('1 column')
  })

  it('pluralizes everything else, zero included', () => {
    expect(pluralize(0, 'row', 'rows')).toBe('0 rows')
    expect(pluralize(2, 'row', 'rows')).toBe('2 rows')
    expect(pluralize(1428, 'row', 'rows')).toBe('1,428 rows')
  })
})

describe('formatBytes', () => {
  it('counts bytes under a kilobyte', () => {
    expect(formatBytes(0)).toBe('0B')
    expect(formatBytes(999)).toBe('999B')
  })

  it('rounds to whole kilobytes', () => {
    expect(formatBytes(1_000)).toBe('1KB')
    expect(formatBytes(24_500)).toBe('25KB')
  })

  it('keeps one decimal on megabytes, matching what a browser reports', () => {
    expect(formatBytes(1_500_000)).toBe('1.5MB')
    expect(formatBytes(38_000_000)).toBe('38.0MB')
  })
})
