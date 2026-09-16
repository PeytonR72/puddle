/**
 * The payload as a URL, and back (locked decision 4).
 *
 * Two properties of the hash fragment are the whole reason it is the hash:
 * a browser never sends it to a server, and it survives being pasted. Puddle
 * has no server to send it to, but a link is pasted into places that do — a
 * chat window, an issue tracker — and the fragment is the part of a URL those
 * do not get to keep in a log.
 *
 * `lz-string` costs a little length on a small schema and saves a great deal on
 * a wide one. The bet is on wide: a link that breaks is one written against a
 * forty-column export, not a three-column one.
 */
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

import { parseSharedQuery, type SharedQuery } from './shared-query'

/** The text after the `#`. Already URL-safe: lz-string's encoded alphabet is. */
export function toShareHash(shared: SharedQuery): string {
  return compressToEncodedURIComponent(JSON.stringify(shared))
}

/**
 * A hash back into a payload, or `null` for anything that is not one.
 *
 * Silence is the specified behaviour for a malformed hash, and the cases it has
 * to cover are ordinary rather than adversarial: a link that lost its tail in a
 * chat window, an anchor from somewhere else, a fragment somebody typed. None
 * of them deserves an error message on a page that otherwise works fine.
 */
export function fromShareHash(hash: string): SharedQuery | null {
  const encoded = hash.startsWith('#') ? hash.slice(1) : hash

  if (encoded === '') {
    return null
  }

  // Typed as returning `string`, but it hands back `null` for input it cannot
  // read — verified against lz-string 1.5. The type describes the happy path;
  // this narrowing describes what actually arrives.
  let decompressed: unknown

  try {
    decompressed = decompressFromEncodedURIComponent(encoded)
  } catch {
    return null
  }

  if (typeof decompressed !== 'string' || decompressed === '') {
    return null
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(decompressed)
  } catch {
    return null
  }

  return parseSharedQuery(parsed)
}

/**
 * The link to put on the clipboard: this page, with the payload as its hash.
 *
 * Whatever hash the address bar already carries is replaced rather than
 * appended to — a link opened from a share link and then copied again should
 * carry the query on screen now, not the one it arrived with.
 */
export function shareLinkFor(href: string, shared: SharedQuery): string {
  const hashAt = href.indexOf('#')
  const base = hashAt === -1 ? href : href.slice(0, hashAt)

  return `${base}#${toShareHash(shared)}`
}
