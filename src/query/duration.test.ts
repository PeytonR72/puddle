import { describe, expect, it } from 'vitest'

import { formatDuration } from './duration'

describe('formatDuration', () => {
  it('reads milliseconds whole', () => {
    expect(formatDuration(12.4)).toBe('12ms')
    expect(formatDuration(999)).toBe('999ms')
  })

  it('rounds a sub-millisecond query to zero rather than claiming precision', () => {
    expect(formatDuration(0.43)).toBe('0ms')
  })

  it('switches to seconds at a second', () => {
    expect(formatDuration(1_000)).toBe('1.0s')
    expect(formatDuration(59_940)).toBe('59.9s')
  })

  it('switches to minutes at a minute', () => {
    expect(formatDuration(60_000)).toBe('1m 0s')
    expect(formatDuration(125_000)).toBe('2m 5s')
  })

  it('treats a negative or non-finite duration as zero', () => {
    expect(formatDuration(-5)).toBe('0ms')
    expect(formatDuration(Number.NaN)).toBe('0ms')
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0ms')
  })
})
