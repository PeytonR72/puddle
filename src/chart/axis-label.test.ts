import { describe, expect, it } from 'vitest'

import {
  compactTick,
  formatTick,
  MAX_TICK_CHARS,
  MAX_Y_TICK_CHARS,
  MIN_Y_AXIS_WIDTH,
  truncateLabel,
  yAxisLabels,
} from './axis-label'

describe('truncateLabel', () => {
  it('leaves a label that fits exactly alone', () => {
    expect(truncateLabel('2026-09-16')).toBe('2026-09-16')
    expect(truncateLabel('abcdefghijkl', 12)).toBe('abcdefghijkl')
  })

  it('shortens a long label visibly, rather than letting it be clipped', () => {
    const label = truncateLabel('Llanfairpwllgwyngyll', 12)

    expect(label).toHaveLength(12)
    expect(label.endsWith('…')).toBe(true)
  })

  it('defaults to the width one tick gets', () => {
    expect(truncateLabel('x'.repeat(40))).toHaveLength(MAX_TICK_CHARS)
  })

  it('has nothing to say in no room at all', () => {
    expect(truncateLabel('anything', 0)).toBe('')
  })
})

describe('formatTick', () => {
  it('groups a whole number the way every other number in Puddle is grouped', () => {
    expect(formatTick(1234567)).toBe('1,234,567')
    expect(formatTick(-4200)).toBe('-4,200')
  })

  it('rounds away the float noise a domain picks up', () => {
    expect(formatTick(0.30000000000000004)).toBe('0.3')
  })

  it('keeps the digits of a small value, which are all after the point', () => {
    expect(formatTick(0.00001)).toBe('0.00001')
  })

  it('rounds a long fraction on a large value', () => {
    expect(formatTick(1234.56789)).toBe('1,234.5679')
  })

  it('passes a non-finite value through rather than inventing a tick', () => {
    expect(formatTick(Number.NaN)).toBe('NaN')
  })
})

describe('compactTick', () => {
  it('shortens each order of magnitude to its own letter', () => {
    expect(compactTick(20_000_000_000)).toBe('20B')
    expect(compactTick(1_500_000)).toBe('1.5M')
    expect(compactTick(4_000)).toBe('4K')
    expect(compactTick(2.5e12)).toBe('2.5T')
  })

  it('keeps the sign, which is the one digit that changes the meaning', () => {
    expect(compactTick(-2_000_000_000)).toBe('-2B')
  })

  it('leaves a number that is already short alone', () => {
    expect(compactTick(750)).toBe('750')
    expect(compactTick(0)).toBe('0')
  })
})

describe('yAxisLabels', () => {
  it('reserves the floor for short ticks', () => {
    expect(yAxisLabels([0, 5, 10]).width).toBe(MIN_Y_AXIS_WIDTH)
  })

  it('grows for the widest tick it was given', () => {
    expect(yAxisLabels([0, 9_000_000]).width).toBeGreaterThan(MIN_Y_AXIS_WIDTH)
  })

  it('spells the ticks out while they fit', () => {
    expect(yAxisLabels([0, 4_000]).format(4_000)).toBe('4,000')
  })

  it('switches the whole axis to the compact form when one tick will not fit', () => {
    const { format, width } = yAxisLabels([0, 10_000_000_000, 20_000_000_000])

    // Not just the long one: an axis reading 0 · 10B · 20,000,000,000 would
    // describe its own scale in two vocabularies.
    expect(format(0)).toBe('0')
    expect(format(20_000_000_000)).toBe('20B')
    expect(width).toBeLessThan(yAxisLabels([0, 4_000]).width + 40)
  })

  it('never reserves more than the longest label it decided to draw', () => {
    const { format, width } = yAxisLabels([0, 1e15])
    const widest = Math.max(...[0, 1e15].map((tick) => format(tick).length))

    expect(widest).toBeLessThanOrEqual(MAX_Y_TICK_CHARS)
    expect(width).toBeLessThan(120)
  })

  it('reserves the floor when there are no ticks at all', () => {
    expect(yAxisLabels([]).width).toBe(MIN_Y_AXIS_WIDTH)
  })
})
