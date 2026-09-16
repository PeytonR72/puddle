import { describe, expect, it } from 'vitest'

import { compressToEncodedURIComponent } from 'lz-string'

import { fromShareHash, shareLinkFor, toShareHash } from './share-link'
import type { SharedQuery } from './shared-query'

const shared: SharedQuery = {
  query: 'SELECT region, sum(amount) AS total FROM data GROUP BY region',
  schema: [
    { name: 'region', type: 'VARCHAR' },
    { name: 'amount', type: 'DOUBLE' },
  ],
  fileName: 'orders.csv',
}

describe('toShareHash', () => {
  it('round-trips a payload', () => {
    expect(fromShareHash(toShareHash(shared))).toEqual(shared)
  })

  it('round-trips a query carrying quotes, newlines and non-ASCII', () => {
    const awkward: SharedQuery = {
      query: 'SELECT "Total Sales"\nFROM data\nWHERE région = \'Nord\' -- ✓',
      schema: [{ name: 'région', type: 'VARCHAR' }],
      fileName: 'ventes 2024.csv',
    }

    expect(fromShareHash(toShareHash(awkward))).toEqual(awkward)
  })

  it('produces something that survives a URL unescaped', () => {
    const hash = toShareHash(shared)

    expect(encodeURIComponent(hash)).toBe(hash)
  })
})

describe('fromShareHash', () => {
  it('reads a hash with or without its leading #', () => {
    const hash = toShareHash(shared)

    expect(fromShareHash(`#${hash}`)).toEqual(shared)
    expect(fromShareHash(hash)).toEqual(shared)
  })

  it('returns null for no hash at all', () => {
    expect(fromShareHash('')).toBeNull()
    expect(fromShareHash('#')).toBeNull()
  })

  it('returns null for a hash that is not a payload', () => {
    // An anchor from somewhere else, and a link that lost its tail on the way
    // through a chat window. Neither is an error worth reporting.
    expect(fromShareHash('#results')).toBeNull()
    expect(fromShareHash(`#${toShareHash(shared).slice(0, 12)}`)).toBeNull()
  })

  it('returns null for compressed text that is not JSON', () => {
    expect(fromShareHash(`#${compressToEncodedURIComponent('not a payload')}`)).toBeNull()
  })

  it('returns null for JSON that is not a payload', () => {
    expect(fromShareHash(`#${compressToEncodedURIComponent('{"query":"SELECT 1"}')}`)).toBeNull()
  })
})

describe('shareLinkFor', () => {
  it('puts the payload in the hash and nowhere else', () => {
    const link = shareLinkFor('https://puddle.example/', shared)

    expect(link.startsWith('https://puddle.example/#')).toBe(true)
    expect(link).not.toContain('?')
    // The whole privacy claim: a link describes a dataset, it does not carry one.
    expect(link).not.toContain('orders.csv')
  })

  it('replaces the hash the page arrived with', () => {
    const link = shareLinkFor(`https://puddle.example/#${toShareHash(shared)}`, {
      ...shared,
      query: 'SELECT 1',
    })

    expect(fromShareHash(new URL(link).hash)?.query).toBe('SELECT 1')
  })

  it('keeps the rest of the URL, query string included', () => {
    const link = shareLinkFor('https://puddle.example/app?theme=light', shared)

    expect(link.startsWith('https://puddle.example/app?theme=light#')).toBe(true)
  })
})
