# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: a hiring reviewer**, reading Puddle as evidence of how its author works. The
answer given at init was "hiring reviewer, honestly" — the person querying a CSV is a
plausible but secondary reader, and the product is built around the first. The reviewer
is hiring for **frontend / product engineering**, so what they are reading is interface
judgement, state handling, and craft under real constraints. The screen is the artifact.

**Secondary: the person with a file.** Someone technical enough to write SQL, with a CSV
or TSV they want to interrogate. This reader is not fictional — the primary reader is only
convinced by a tool that genuinely works — but where the two conflict, the reviewer wins.

They agree more often than they diverge. A reviewer reads an unhandled empty state or a
default-styled error faster than they read a good decision, and those are the same things
that make the second reader's session work.

The session the product is designed against: a stranger arrives on a desktop browser,
having never seen it, with no file of their own and no intention to install anything.

## Product Purpose

Puddle is a browser-local SQL notebook on DuckDB-WASM. A file goes in, SQL runs against
it, and the answer comes back as a table and a chart. The engine, the data, and the query
stay in the tab: no backend, no accounts, no API keys.

**Success is portfolio evidence first.** The bar, from `CLAUDE.md`: a stranger lands on
the site in a desktop browser, clicks one button, sees a real query run against a real
dataset with a chart, and can copy a share link. Real repeat usage is welcome and is not
the measure.

## Positioning

The thing a neighbouring tool cannot truthfully copy: **the query engine is in the page**.
Not a hosted warehouse with a browser client, not a file upload with a server-side reader —
DuckDB itself compiled to WASM, reading a `File` handle the browser already has. That is
what makes "your data never leaves the tab" a fact about the network panel rather than a
privacy promise someone has to trust.

Two consequences the product is built to keep honest:

- **Nothing is uploaded, so nothing can be shared by accident.** A share link carries the
  query and the expected column names; it never carries a row.
- **No install, no account, no key.** The first run costs a click, not a setup.

## Operating Context

- **Desktop browser is the designed case.** A SQL notebook is a keyboard-and-pointer tool
  with width to spend. Phones stay usable — the same path works, nothing overflows,
  controls take a thumb — but mobile is a width Puddle passes, not the one it is designed
  against.
- **One session, one file.** No workspace to return to, no history. Closing the tab ends
  the session, by design rather than by omission.
- **The files are real-world exports**: a download, a dump, a spreadsheet saved as CSV.
  Untidy headers and mixed types are the normal case, not the edge.
- **The engine is visibly several megabytes.** DuckDB-WASM loads on first user intent, not
  with the page, so booting is a state a first-time reader watches. It is part of the
  product's surface, not an implementation detail behind a spinner.
- **Deployed on Vercel** as a static SPA (`vercel.json` rewrites everything to
  `index.html`). A stranger can reach it at a URL; there is no server behind it.

## Capabilities and Constraints

Confirmed and shipped (v1 scope is the table in `CLAUDE.md`, which is the authority):

- One file per session — CSV, TSV, Parquet — by drag-drop or file picker.
- A flat schema panel of columns with inferred types; clicking one inserts it into the
  editor.
- A single SQL editor. Run button plus Cmd/Ctrl+Enter. Errors inline.
- A virtualized, type-aware results table with row count and execution time.
- One chart below the results: inferred x/y with manual override, bar and line.
- A share link encoding query plus expected schema in the URL hash. Never the data.
- A landing page whose demo runs against a bundled dataset with no file of the reader's own.

Technical constraints that are settled and not reopened by convenience (the locked
decisions in `CLAUDE.md`, with records in `docs/adr/`):

- DuckDB loads lazily on first intent, with determinate progress.
- The non-cross-origin-isolated bundle (`mvp`/`eh`), so no COOP/COEP headers are required
  and portability and third-party embedding are preserved.
- The `File` object is registered with DuckDB, never read into a JS string.
- All query execution goes through one module, `src/duckdb/client.ts`.
- No query depends on a third party being reachable at run time.

Deliberately out of scope for v1, listed as planned work in `README.md`: multiple cells,
joins across files, saved workspaces or history, SQL autocomplete, a nested schema
browser, CSV export, a dark mode toggle, auth of any kind.

**Open product decision — Parquet.** `docs/adr/0001` is `proposed`, not accepted. The
shipped DuckDB-WASM bundles do not link the Parquet reader, so `read_parquet` fails on
every file. `.parquet` is accepted today and fails with a message naming the missing
reader rather than blaming the file. Whether Parquet stays in the v1 scope table is
undecided; future work must not describe it as working.

## Brand Commitments

- **The name `puddle` is fixed**, set lowercase as a wordmark.
- **The line "SQL in the browser tab" is copy, not a commitment.** Later work may rewrite it.
- **Voice: written, not generated.** The repo carries a `content-humanizer` skill for user-
  facing text, and `CLAUDE.md` splits the two voices deliberately — machine vocabulary is
  the interface's default and a human sentence appears where a person is actually speaking
  to the reader.
- **No third-party requests at runtime**, including webfonts. The central claim is that
  nothing leaves the tab, and a font fetched from a CDN to render that sentence would
  contradict it in the network panel. This is a product commitment with visual
  consequences, not a stylistic preference.

## Evidence on Hand

- **The working product.** A deployed Vercel build and the repo itself are the evidence.
  For the primary reader, the shipped states are the portfolio: boot progress, a refused
  file, a DuckDB error, an empty result, a share link opened without a file.
- **`public/demo/coffee-shop-sales.csv`** — 2000 rows of `date,category,revenue`. **This
  data is synthetic.** No copy may present it as a real business's numbers or as a
  customer's data.
- **Written decision records**: `CLAUDE.md` (scope and locked decisions), `CONTEXT.md`
  (domain vocabulary — not yet written), `docs/adr/`, `docs/design/tokens.md`.
- **There are no users, testimonials, benchmarks, press, usage numbers, or customers.**
  None exist. Future copy must not fabricate any of them, and must not imply adoption,
  team size, or a track record the project does not have.
- No logo file, no illustration set, no photography.

## Product Principles

1. **The reviewer reads the unglamorous states first.** Booting, refusing, failing, and
   empty are where craft is legible. They get designed, not defaulted.
2. **Ship the smaller thing, and say that it is a decision.** The v1 boundary is written
   down and the backlog is public. An absent feature that is named reads as judgement; the
   same feature absent and unmentioned reads as an oversight.
3. **The privacy claim has to survive the network panel.** Anything that leaves the tab —
   a font, a telemetry ping, a runtime extension fetch — breaks the one sentence the
   product is built on.
4. **Desktop is the designed case; mobile is a width that passes.** Do not average the two
   into a layout that serves neither.
5. **Machine vocabulary is the default; a human sentence is spent where a person is
   genuinely speaking.** `VARCHAR`, `NULL`, a row count, and a millisecond timing are the
   content, not chrome to soften.

## Accessibility & Inclusion

WCAG AA on text contrast is a committed floor, checked in `docs/design/tokens.md` rather
than assumed. A visible focus ring on every interactive element, never removed. The
keyboard path works without a pointer, including the schema list, where each column
inserts on Enter or Space. Motion collapses under `prefers-reduced-motion: reduce`.

No further product-specific accessibility requirement was established at init.
