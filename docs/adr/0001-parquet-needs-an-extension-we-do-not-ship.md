---
status: proposed
---

# Parquet needs an extension we do not ship

`@duckdb/duckdb-wasm@1.33.1-dev57.0` does not link the Parquet reader into its `mvp` or
`eh` bundles, so `read_parquet` fails on every file. Parquet is in the v1 scope table, so
this needs a decision, and every option costs something we have already decided against.

Verified in Chromium against the `eh` bundle DuckDB selects, not assumed. On a clean
engine `duckdb_extensions()` reports `parquet` as `NOT_INSTALLED`, `autoinstall_known_extensions`
is `false`, and `read_parquet` traps in WebAssembly rather than raising a SQL error —
"table index is out of bounds", "memory access out of bounds", or "null function or
function signature mismatch" depending on what ran before it. `INSTALL parquet` resolves
to `https://extensions.duckdb.org/v1.5.4/wasm_eh/parquet.duckdb_extension.wasm`, which is
also how a Parquet file DuckDB itself wrote fails to be read back.

Those trap strings are what `src/dataset/ingest-failure.ts` matches on, and they are
generic WebAssembly failures rather than anything Parquet-shaped — only the file's
extension makes them mean "Parquet". If this ADR is resolved by making Parquet work, that
matching needs revisiting: the message it produces today would then be wrong, and a
genuinely corrupt Parquet file would deserve the footer message instead.

## Considered options

1. **Vendor `parquet.duckdb_extension.wasm` into `public/`** and point DuckDB at our own
   origin with `custom_extension_repository` plus `allow_unsigned_extensions`. Keeps the
   approved "no query depends on a third party being reachable" decision intact, at the
   cost of a vendored binary we have to re-fetch on every DuckDB upgrade.
2. **Let DuckDB fetch the extension from `extensions.duckdb.org` at runtime.** One line of
   code, and it reverses that decision: the first Parquet query would depend on a CDN
   being up.
3. **Drop Parquet from v1**, leaving CSV and TSV, and move it to the `README.md` backlog.
   Changes the scope table in `CLAUDE.md`.

Option 1 is the one that costs no existing decision. It could not be done in the session
that found this: `extensions.duckdb.org` is blocked by the container's proxy (403 on
CONNECT), the extension is not published to npm, and the file has to come from somewhere
with access.

Until this is resolved, `.parquet` is still accepted, still routed to `read_parquet`, and
fails with a message that says the reader is missing rather than blaming the file.
