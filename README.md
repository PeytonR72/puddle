# Puddle

A browser-local SQL notebook built on DuckDB-WASM.

Drop in a CSV, TSV, or Parquet file and query it. The engine, your data, and your query
stay in the browser tab — there is no backend, no accounts, and no API keys.

## Planned

These are deliberately not in v1. Each one is a decision to ship the smaller thing first,
and each is planned for v1.1:

- **Multiple cells** — v1 is one editor, not a cell sequence.
- **Joins across multiple uploaded files** — v1 loads one file per session.
- **Saved workspaces or history** — share links carry a query today; nothing persists.
- **SQL autocomplete** — the schema panel inserts column names in the meantime.
- **Nested schema browser** — v1 shows a flat column list.
- **Export to CSV** — results are read-only for now.
- **Dark mode toggle** — v1 ships one theme.
- **Auth of any kind** — Puddle has no server to authenticate against.
