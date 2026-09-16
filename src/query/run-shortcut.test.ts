import { describe, expect, it } from 'vitest'

import { isApplePlatform, runShortcutLabel } from './run-shortcut'

const MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'
const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

describe('isApplePlatform', () => {
  it('recognises a Mac and an iPad', () => {
    expect(isApplePlatform(MAC)).toBe(true)
    expect(isApplePlatform(IPAD)).toBe(true)
  })

  it('does not claim Windows or an unknown agent', () => {
    expect(isApplePlatform(WINDOWS)).toBe(false)
    expect(isApplePlatform('')).toBe(false)
  })
})

describe('runShortcutLabel', () => {
  it('writes the key each platform actually reaches for', () => {
    expect(runShortcutLabel(MAC)).toBe('⌘↵')
    expect(runShortcutLabel(WINDOWS)).toBe('Ctrl+↵')
  })
})
