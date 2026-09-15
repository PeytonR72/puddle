import { describe, expect, it } from 'vitest'

import { columnReference, needsQuoting } from './column-reference'

describe('columnReference', () => {
  it('leaves an ordinary name bare', () => {
    expect(columnReference('id')).toBe('id')
    expect(columnReference('order_total')).toBe('order_total')
    expect(columnReference('_private')).toBe('_private')
    expect(columnReference('col2')).toBe('col2')
  })

  it('quotes a name with a space in it', () => {
    expect(columnReference('Total Sales')).toBe('"Total Sales"')
  })

  it('quotes a name that starts with a digit', () => {
    // A bare 2024 is a number literal, not a column.
    expect(columnReference('2024')).toBe('"2024"')
  })

  it('quotes a name carrying punctuation', () => {
    expect(columnReference('total-sales')).toBe('"total-sales"')
    expect(columnReference('revenue (usd)')).toBe('"revenue (usd)"')
    expect(columnReference('a,b,c')).toBe('"a,b,c"')
  })

  it('quotes a reserved word', () => {
    expect(columnReference('order')).toBe('"order"')
    expect(columnReference('select')).toBe('"select"')
    expect(columnReference('group')).toBe('"group"')
  })

  it('quotes a reserved word whatever its case', () => {
    expect(columnReference('Order')).toBe('"Order"')
    expect(columnReference('SELECT')).toBe('"SELECT"')
  })

  it('leaves a keyword that is legal bare alone', () => {
    // Over-quoting these would make the common case ugly for no gain.
    expect(columnReference('count')).toBe('count')
    expect(columnReference('value')).toBe('value')
    expect(columnReference('date')).toBe('date')
    expect(columnReference('year')).toBe('year')
  })

  it('doubles a quote already in the name', () => {
    expect(columnReference('say "hi"')).toBe('"say ""hi"""')
  })

  it('quotes an empty name rather than inserting nothing', () => {
    expect(columnReference('')).toBe('""')
  })
})

describe('needsQuoting', () => {
  it('answers the question columnReference asks it', () => {
    expect(needsQuoting('id')).toBe(false)
    expect(needsQuoting('Total Sales')).toBe(true)
    expect(needsQuoting('order')).toBe(true)
  })
})
