import { describe, expect, it } from 'vitest'

import { niceScale } from './axis-scale'
import type { ChartPoint } from './chart-series'

const series = (...values: (number | null)[]): ChartPoint[] =>
  values.map((value, index) => ({ label: `p${index}`, value }))

describe('niceScale', () => {
  it('puts the ticks on numbers a reader can count in', () => {
    // The extent is 0–3,798. Cut into equal parts it gives ticks at 950; this
    // is the whole reason the module exists.
    const scale = niceScale(series(12, 3798), { includeZero: true })

    expect(scale?.ticks).toEqual([0, 1000, 2000, 3000, 4000])
  })

  it('starts a bar axis at zero, whatever the data starts at', () => {
    expect(niceScale(series(980, 1020), { includeZero: true })?.domain[0]).toBe(0)
  })

  it('fits a line axis to the data, so a narrow range still has a shape', () => {
    const scale = niceScale(series(18.2, 23.9), { includeZero: false })

    expect(scale?.domain[0]).toBeGreaterThan(0)
    expect(scale?.domain[1]).toBeGreaterThanOrEqual(23.9)
  })

  it('covers both sides of zero when the values do', () => {
    const scale = niceScale(series(-50, 100), { includeZero: true })

    expect(scale?.domain[0]).toBeLessThanOrEqual(-50)
    expect(scale?.domain[1]).toBeGreaterThanOrEqual(100)
    expect(scale?.ticks).toContain(0)
  })

  it('reaches past the extremes rather than clipping a mark', () => {
    const scale = niceScale(series(1, 4321), { includeZero: true })

    expect(scale?.domain[1]).toBeGreaterThanOrEqual(4321)
  })

  it('holds its precision on a small step', () => {
    const scale = niceScale(series(0, 0.5), { includeZero: true })

    // 0.1 + 0.2 is 0.30000000000000004, and a tick is not allowed to say so.
    expect(scale?.ticks).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5])
  })

  it('gives a single value a scale to sit on', () => {
    const zeroed = niceScale(series(42), { includeZero: true })

    expect(zeroed?.domain[0]).toBe(0)
    expect(zeroed?.domain[1]).toBeGreaterThanOrEqual(42)

    const fitted = niceScale(series(42), { includeZero: false })

    expect(fitted?.domain[0]).toBeLessThan(42)
    expect(fitted?.domain[1]).toBeGreaterThan(42)
  })

  it('scales a column of zeros without dividing by one', () => {
    const scale = niceScale(series(0, 0), { includeZero: true })

    expect(scale?.domain[0]).toBeLessThanOrEqual(0)
    expect(scale?.domain[1]).toBeGreaterThan(0)
  })

  it('skips the holes and scales what is left', () => {
    expect(niceScale(series(null, 500, null), { includeZero: true })?.ticks).toContain(500)
  })

  it('has no scale to give when every value is absent', () => {
    expect(niceScale(series(null, null), { includeZero: true })).toBe(null)
    expect(niceScale([], { includeZero: true })).toBe(null)
  })

  it('never runs away on a domain it cannot divide', () => {
    const scale = niceScale(series(0, 1e21), { includeZero: true })

    expect(scale?.ticks.length).toBeLessThanOrEqual(24)
  })
})
