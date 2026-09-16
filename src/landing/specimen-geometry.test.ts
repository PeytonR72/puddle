import { describe, expect, it } from 'vitest'

import { plotSpecimen, weekAt, weekStartDate } from './specimen-geometry'

describe('plotSpecimen', () => {
  it('spreads the weeks evenly across the unit width', () => {
    const plot = plotSpecimen({ category: 'Tea', weeks: [10, 20, 30] })
    expect(plot.points.map((p) => p.x)).toEqual([0, 0.5, 1])
  })

  it('scales each specimen inside its own range', () => {
    const plot = plotSpecimen({ category: 'Tea', weeks: [80, 90, 100] })
    expect(plot.points.map((p) => p.y)).toEqual([0, 0.5, 1])
    expect(plot.low).toBe(80)
    expect(plot.high).toBe(100)
  })

  it('reports the mean it prints beside the trace', () => {
    const plot = plotSpecimen({ category: 'Coffee', weeks: [100, 200, 300] })
    expect(plot.mean).toBe(200)
  })

  // A category whose weekly mean never moves is rare but not impossible, and a
  // NaN trace would vanish from the sheet rather than sit on its baseline.
  it('lays a flat specimen on its baseline instead of dividing by zero', () => {
    const plot = plotSpecimen({ category: 'Flat', weeks: [50, 50, 50] })
    expect(plot.points.every((p) => p.y === 0)).toBe(true)
  })

  it('survives a single-week specimen', () => {
    const plot = plotSpecimen({ category: 'One', weeks: [42] })
    expect(plot.points).toEqual([{ x: 0, y: 0 }])
    expect(plot.mean).toBe(42)
  })
})

describe('weekAt', () => {
  it('snaps to the nearest week', () => {
    expect(weekAt(5, 0)).toBe(0)
    expect(weekAt(5, 0.5)).toBe(2)
    expect(weekAt(5, 1)).toBe(4)
  })

  it('holds at the ends when the pointer leaves the field', () => {
    expect(weekAt(5, -3)).toBe(0)
    expect(weekAt(5, 9)).toBe(4)
  })

  it('answers for an empty specimen without throwing', () => {
    expect(weekAt(0, 0.5)).toBe(0)
  })
})

describe('weekStartDate', () => {
  it('counts forward in whole weeks', () => {
    expect(weekStartDate('2024-01-01', 0)).toBe('2024-01-01')
    expect(weekStartDate('2024-01-01', 1)).toBe('2024-01-08')
    expect(weekStartDate('2024-01-01', 9)).toBe('2024-03-04')
  })

  it('crosses a month and a leap day in UTC', () => {
    expect(weekStartDate('2024-02-26', 1)).toBe('2024-03-04')
  })
})
