import { useState } from 'react'

import { fromShareHash } from './share-link'
import type { SharedQuery } from './shared-query'

/**
 * The query this page was opened with, or `null` for an ordinary session.
 *
 * Read once, at mount, and never again. A share link is the state the tab
 * opened in, not a channel the address bar keeps talking through: reacting to
 * `hashchange` would let a back button replace SQL somebody is in the middle of
 * writing, and there is nothing in v1 that changes the hash on its own.
 *
 * A malformed hash reads as no hash at all: that is the specified behaviour,
 * and `fromShareHash` is where it is decided.
 */
export function useSharedQuery(): SharedQuery | null {
  const [shared] = useState<SharedQuery | null>(() => fromShareHash(window.location.hash))

  return shared
}
