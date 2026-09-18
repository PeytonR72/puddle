/**
 * Where the DuckDB WASM module and its worker script come from.
 *
 * Vite's `?url` turns each of these into an asset it serves and fingerprints
 * itself, so the app boots from its own origin. The published recipe reaches
 * for jsDelivr instead; that makes every first query depend on a CDN being up
 * and reachable, which is not a dependency a browser-local tool should have.
 *
 * Only the `mvp` and `eh` bundles are listed. `coi` is the cross-origin-isolated
 * build and needs COOP/COEP response headers: locked decision 2 rules it out.
 */
import ehModule from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
import mvpModule from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'

export type BundleSource = {
  mainModule: string
  mainWorker: string
}

export type LocalBundles = {
  mvp: BundleSource
  eh: BundleSource
}

export const localBundles: LocalBundles = {
  mvp: { mainModule: mvpModule, mainWorker: mvpWorker },
  eh: { mainModule: ehModule, mainWorker: ehWorker },
}
