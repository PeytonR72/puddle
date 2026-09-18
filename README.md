# puddle

**Runs a real SQL engine in the browser, with no server, verifiable in the network tab.**

A SQL notebook that runs entirely in a browser tab.

**[puddle-neon.vercel.app](https://puddle-neon.vercel.app)**

Drop in a CSV and write SQL against it. DuckDB is compiled to WebAssembly and runs in the
page, so the file is read off your disk by the tab you are looking at. There is no
backend, no account, and no API key: open the page on a plane and it still works.

The privacy claim is checkable rather than promised: open the network panel and watch a
query run without a request.

## Try it

Open [puddle-neon.vercel.app](https://puddle-neon.vercel.app) and press **Try the demo**.
It loads a bundled 2,000-row dataset, runs a query against it, and draws the result. No
file of your own, no sign-up.

Or run it locally:

```bash
npm install
npm run dev
```

The first screen is a specimen sheet of the demo data (four weekly revenue traces drawn
from the bundled CSV. Clicking a reading hands you the SQL behind that week rather than
just a picture of it.

## What it does

**One file per session.** CSV, TSV, or Parquet, by drag-drop or file picker. The `File`
object is handed to DuckDB, which reads the bytes it needs when it needs them; a 200MB
CSV is never pulled through `FileReader` into a JS string. Every dataset is exposed as a
view called `data`, whatever the file is called, so a query written against one file is
portable to another.

**A schema panel** listing every column with the type DuckDB inferred for it: `VARCHAR`,
`BIGINT`, `DATE`. Click a column to insert its name at the cursor; Enter and Space do the
same from the keyboard.

**A SQL editor** on CodeMirror, with a DuckDB dialect written for it rather than borrowed
from Postgres: `QUALIFY`, `PIVOT`, `EXCLUDE` and `USING SAMPLE` highlight, `#` is not a
comment, and `::` is a cast. Columns that exist in the loaded file are marked as you type,
so a misspelled name is visible before you run it. Run with the button or Cmd/Ctrl+Enter.

**A results grid**, virtualized on both axes, with a sticky header, a row count, and the
query's execution time. Formatting is type-aware and nothing is rounded: numbers keep
every digit DuckDB gave them, grouped for reading. `NULL` renders as a token, never as an
empty cell. An absent value and an empty string are different answers.

**A chart** below the grid. It picks an x and a y from the result's column types and lets
you override either; bar and line. A bar starts at zero and a line does not, because a bar
encodes value as length and a baseline anywhere else overstates every difference. Ticks
are round numbers (200, 400, 600) instead of the exact data extent cut into fifths.
`NULL` stays a hole in the line rather than a segment drawn across it.

**A share link** carrying the query, the column names it was written against, and the
file name, compressed with `lz-string` into the URL hash, which browsers never send to a
server. It never carries a row. Open one without a file and you get the query read-only
beside the columns it expects; drop a matching file and it runs itself. Drop one that is
missing columns and Puddle names them rather than refusing, because the person holding the
link is the one who knows whether their export is the same data under different headings.

### The states in between

Most of the work is in the parts that are not the happy path, and they are designed rather
than defaulted:

- **Booting.** DuckDB is several megabytes and does not load with the landing page. It
  starts on the first real intent (the demo button or a dropped file) behind a
  determinate progress bar reading actual bytes.
- **Refusing.** A `.docx` is turned away by extension before the engine downloads, so a
  wrong file never costs a stranger the WASM bundle. A drop carrying three files says so
  instead of silently taking the first.
- **Failing to load.** DuckDB's CSV sniffer answers a bad file with twenty lines about
  candidate delimiters and a caret pointing at SQL you never wrote. Puddle writes a
  sentence for what happened and a sentence for what to try, and keeps DuckDB's own text
  beside them in a disclosure.
- **Failing to run.** The opposite call: you wrote this SQL, and `Referenced column
  "amont" not found in FROM clause! Candidate bindings: "amount"` is the most useful
  sentence on the screen. It is shown verbatim, with a headline that only says which kind
  of wrong it is.
- **Loading strangely.** A file whose separator was guessed wrong raises nothing; it just
  comes back looking odd. When DuckDB numbers the columns `column0`, `column1`, Puddle says
  the first line was read as data and leaves the judgement to you.
- **Empty.** A query that succeeded and matched no rows reads as a success, not as a blank
  area that looks the same as a failure.

## How it works

```
File ──registerFileHandle──▶ DuckDB-WASM (worker)
                                 │
                      src/duckdb/client.ts  ← the only module that imports the bindings
                                 │
              ┌──────────────────┼──────────────────┐
           dataset             query              results / chart
        (ingest, schema)   (editor, run)        (grid, series, axes)
                                 │
                              share  ← query + schema → URL hash, never rows
```

Six decisions shape the codebase. Most are recorded in `CLAUDE.md` as locked, which means
an implementation that finds one inconvenient has to change the decision there rather than
route around it in code.

**DuckDB loads lazily.** A landing page that hangs for five seconds before it can show
anything reads as broken, so nothing fetches the engine until someone asks for it.

**The non-cross-origin-isolated bundle.** DuckDB's `coi` build needs COOP/COEP response
headers, which break third-party embeds and tax portability. Puddle uses `mvp`/`eh`, which
run without `SharedArrayBuffer`. Slower on huge files; irrelevant at this scale.

**The WASM ships from our own origin.** DuckDB's published recipe pulls its bundle from
jsDelivr, which would make every first query depend on a CDN being reachable. Vite
fingerprints and serves the assets instead. The same rule rules out webfonts from a CDN: a
font fetched to render "nothing leaves the tab" would contradict that sentence in the
network panel.

**One module owns the engine.** `src/duckdb/client.ts` holds the worker, the connection
lifecycle, and the query API. Nothing above it imports `@duckdb/duckdb-wasm`. That is the
seam every test mocks and the reason the engine is swappable.

**Data is parsed at the boundary, then trusted.** Arrow hands back live objects that are
valid only while their table is. `src/duckdb/result.ts` narrows them into plain values, so
a result can outlive the table it came from and no component ever holds an Arrow type.
Past that boundary, types are trusted because they were earned.

**Decisions live in pure modules.** Each feature folder keeps its judgement in files with
no React in them: `chart-axes.ts` picks the axes, `cell-format.ts` rules that `NULL` is
never blank, `run-state.ts` answers whether Run may fire and why not, and one impure
module that talks to the engine. It is what makes 316 tests possible without a DOM.

## Layout

```
src/
  duckdb/      client.ts, bundles.ts, result.ts, use-duckdb.ts
  dataset/     ingest, the schema panel, the drop surface
  query/       the CodeMirror editor, the DuckDB dialect, the run
  results/     the virtualized grid, cell formatting, column widths
  chart/       axis inference, series, scales, the Recharts render
  share/       the payload, the lz-string codec, schema matching
  landing/     the specimen sheet and its precomputed series
docs/
  adr/         decision records
  design/      the token plan every component composes from
  agents/      issue tracker and triage conventions
```

Tests sit beside the code they cover as `*.test.ts`. `CLAUDE.md` is the scope table and
the locked decisions; `PRODUCT.md` is who it is for; `DESIGN.md` is the shipped design
system.

## Development

```bash
npm run dev        # Vite dev server
npm test           # Vitest: 316 tests across 31 files
npm run typecheck  # tsc -b
npm run build      # tsc -b && vite build
```

TypeScript runs `strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and
`noImplicitOverride`. `any` does not ship. `as` is treated as a claim you cannot back;
tests use `@total-typescript/shoehorn` for partial fixtures instead.

It deploys as a static build: `vercel.json` rewrites every path to `index.html`. There is
no server behind it, because there is no server.

## Design

The interface is built from hairline rules and monospace rather than cards and shadows,
because a result set has no cards in it: structure comes from the same device the data
already uses. `docs/design/tokens.md` is the token plan, written before the first
component; `src/index.css` implements it. Text contrast meets WCAG AA, every interactive
element keeps a visible focus ring, the keyboard path works without a pointer, and motion
collapses under `prefers-reduced-motion`.

Desktop is the case Puddle is designed against: a SQL notebook is a keyboard-and-pointer
tool with width to spend. Phones stay usable: the same path works, nothing overflows,
controls take a thumb.

## Known limits

**Parquet does not read yet.** `.parquet` is accepted and routed to `read_parquet`, but
the DuckDB-WASM bundles keep the Parquet reader in a separate extension this build does
not carry, so it fails, with a message naming the missing reader rather than blaming your
file. CSV and TSV work. The options and their costs are written up in
`docs/adr/0001-parquet-needs-an-extension-we-do-not-ship.md`; the decision is still open.

The demo dataset is synthetic. It is not a real business's numbers.

## Planned

Each of these is a decision to ship the smaller thing first, not an oversight:

- **Multiple cells**: v1 is one editor, not a cell sequence.
- **Joins across files**: v1 loads one file per session.
- **Saved workspaces or history**: share links carry a query; nothing persists.
- **SQL autocomplete**: the schema panel inserts column names in the meantime.
- **Nested schema browser**: v1 shows a flat column list.
- **Export to CSV**: results are read-only for now.
- **Dark mode toggle**: v1 ships one theme.
- **Auth**: there is no server to authenticate against.
