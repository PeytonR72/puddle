import { describe, expect, it } from 'vitest'

import type { Column } from '../duckdb/client'
import {
  axisOptions,
  inferAxes,
  isPlottable,
  NO_OVERRIDE,
  resolveAxes,
  type AxisChoice,
} from './chart-axes'

const column = (name: string, type: string, kind: Column['kind']): Column => ({ name, type, kind })

const day = column('day', 'DATE', 'date')
const region = column('region', 'VARCHAR', 'string')
const revenue = column('revenue', 'DOUBLE', 'number')
const orders = column('orders', 'BIGINT', 'bigint')

describe('isPlottable', () => {
  it('takes the two numeric kinds', () => {
    expect(isPlottable('number')).toBe(true)
    expect(isPlottable('bigint')).toBe(true)
  })

  it('refuses a date, which arrives as a number but is not a height', () => {
    // A DATE is epoch milliseconds. Plotted, it is a bar 1.7 trillion tall.
    expect(isPlottable('date')).toBe(false)
    expect(isPlottable('timestamp')).toBe(false)
  })

  it('refuses everything that is not a number at all', () => {
    expect(isPlottable('string')).toBe(false)
    expect(isPlottable('boolean')).toBe(false)
    expect(isPlottable('other')).toBe(false)
  })
})

describe('axisOptions', () => {
  it('offers every column as a label and only the numbers as a height', () => {
    const options = axisOptions([day, region, revenue])

    expect(options.x.map((choice) => choice.name)).toEqual(['day', 'region', 'revenue'])
    expect(options.y.map((choice) => choice.name)).toEqual(['revenue'])
  })

  it('keeps each column at its position, so a duplicate name still resolves', () => {
    const options = axisOptions([column('a', 'INTEGER', 'number'), column('a', 'INTEGER', 'number')])

    expect(options.y).toEqual([
      { index: 0, name: 'a' },
      { index: 1, name: 'a' },
    ])
  })

  it('offers no height at all when the result holds no numbers', () => {
    expect(axisOptions([day, region]).y).toEqual([])
  })
})

describe('inferAxes', () => {
  it('reads a date against the first number', () => {
    expect(inferAxes([day, region, revenue])).toEqual({
      x: { index: 0, name: 'day' },
      y: { index: 2, name: 'revenue' },
    })
  })

  it('prefers a date to a string, wherever the two sit', () => {
    expect(inferAxes([region, revenue, day])?.x).toEqual({ index: 2, name: 'day' })
  })

  it('falls back to the first string when there is no date', () => {
    expect(inferAxes([revenue, region, orders])?.x).toEqual({ index: 1, name: 'region' })
  })

  it('takes the first number as the height, not the largest or the last', () => {
    expect(inferAxes([day, orders, revenue])?.y).toEqual({ index: 1, name: 'orders' })
  })

  it('labels with another number when that is all there is', () => {
    expect(inferAxes([revenue, orders])).toEqual({
      x: { index: 1, name: 'orders' },
      y: { index: 0, name: 'revenue' },
    })
  })

  it('lets a lone number label itself rather than refusing to draw', () => {
    expect(inferAxes([revenue])).toEqual({
      x: { index: 0, name: 'revenue' },
      y: { index: 0, name: 'revenue' },
    })
  })

  it('gives up when nothing in the result is a number', () => {
    expect(inferAxes([day, region])).toBe(null)
    expect(inferAxes([])).toBe(null)
  })
})

describe('resolveAxes', () => {
  const columns = [day, region, revenue, orders]

  it('infers when the reader has chosen nothing', () => {
    expect(resolveAxes(columns, NO_OVERRIDE)).toEqual(inferAxes(columns))
  })

  it('honours a choice the result still holds', () => {
    const y: AxisChoice = { index: 3, name: 'orders' }

    expect(resolveAxes(columns, { x: { index: 1, name: 'region' }, y })).toEqual({
      x: { index: 1, name: 'region' },
      y,
    })
  })

  it('follows a column that moved, so editing a SELECT does not reset the axis', () => {
    const moved = [revenue, day, region, orders]

    expect(resolveAxes(moved, { x: null, y: { index: 3, name: 'revenue' } })?.y).toEqual({
      index: 0,
      name: 'revenue',
    })
  })

  it('drops a choice the next result no longer has a column for', () => {
    expect(resolveAxes(columns, { x: null, y: { index: 9, name: 'margin' } })?.y).toEqual({
      index: 2,
      name: 'revenue',
    })
  })

  it('drops a height that stopped being a number', () => {
    const cast = [day, column('revenue', 'VARCHAR', 'string'), orders]

    // `SELECT CAST(revenue AS VARCHAR)`: the name is still there and the
    // column is not, so the axis falls back rather than plotting text.
    expect(resolveAxes(cast, { x: null, y: { index: 1, name: 'revenue' } })?.y).toEqual({
      index: 2,
      name: 'orders',
    })
  })

  it('keeps a label the height cannot take', () => {
    // x is under no such rule: a VARCHAR is a perfectly good thing to label with.
    expect(resolveAxes(columns, { x: { index: 1, name: 'region' }, y: null })?.x).toEqual({
      index: 1,
      name: 'region',
    })
  })

  it('has nothing to resolve when nothing can be plotted', () => {
    expect(resolveAxes([day, region], { x: { index: 0, name: 'day' }, y: null })).toBe(null)
  })
})
