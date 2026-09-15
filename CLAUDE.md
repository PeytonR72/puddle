# Puddle

Puddle is a browser-local SQL notebook built on DuckDB-WASM. You open a page, drop in
a CSV, TSV, or Parquet file, and write SQL against it in a single editor that shows its
results as a table and a chart. Everything — the engine, the data, the query — stays in
the browser tab. There is no backend, no accounts, and no API keys.

## v1 scope

**In scope.** The boundary column is part of the scope, not a suggested starting point:
building past it is out of scope even where the capability is listed.

| Capability | Boundary |
| --- | --- |
| File ingest | One file per session. CSV, TSV, Parquet. Drag-drop or file picker. |
| Schema panel | Flat list of columns with inferred types. Click to insert name into editor. |
| Query editor | Single SQL editor. Run button plus Cmd/Ctrl+Enter. Errors shown inline. |
| Results table | Virtualized, type-aware formatting, row count and execution time. |
| Chart | One chart below results. Inferred x/y with manual override. Bar and line. |
| Share link | Encodes query plus expected schema in the URL hash. Never the data. |
| Landing page | Live demo with a bundled dataset preloaded. |

**Out of scope.** Each of these is a decision, not an oversight. They are the v1.1
backlog, listed as planned work in `README.md`:

- Multiple cells
- Joins across multiple uploaded files
- Saved workspaces or history
- SQL autocomplete
- Nested schema browser
- Export to CSV
- Dark mode toggle
- Auth of any kind

The table is the boundary. A capability absent from both lists is undecided — ask before
building it, rather than reading it into a neighbouring row. The scope changes by editing
this file, not in passing conversation.

### Definition of done

A stranger lands on the site on a phone, taps one button, sees a real query run against a
real dataset with a chart, and can copy a share link.

That is the whole bar. It sets two things that are easy to lose: the first run needs no
file of the reader's own, and the primary path is a phone. Desktop is the easier case,
so design and test the phone first.

## Architecture decisions (locked)

"Locked" means these are settled and not reopened by an implementation that finds them
inconvenient. When a decision genuinely blocks the work, stop and say so — the fix is
to change the decision here, with a note in `docs/adr/`, not to route around it in code.

**1. DuckDB loads lazily.** The WASM bundle is several megabytes and does not load with
the landing page. Initialize it on first user intent — clicking "Try the demo" or dropping
a file — and show a determinate loading state while it boots. A landing page that hangs
for five seconds on a phone reads as broken.

**2. Use the non-COI bundle.** DuckDB-WASM's cross-origin-isolated build needs COOP/COEP
response headers, which break third-party embeds and tax portability. Use the `mvp` or
`eh` bundle, which runs without `SharedArrayBuffer`. It is slower on huge files and that
does not matter at v1 scale.

**3. Register the file, do not read it into memory.** Hand DuckDB the `File` object and
let it read directly:

```ts
db.registerFileHandle(name, file, DuckDBDataProtocol.BROWSER_FILEREADER, true);
```

Pulling a 200MB CSV through `FileReader.readAsText` into a JS string is the failure this
rules out.

**4. Share links encode the query, not the data.** Serialize `{ query, schema, fileName }`,
compress with `lz-string`, and store it in the URL hash fragment, which is never
transmitted to a server. On load with a hash present, show the query read-only beside the
expected column list and prompt: "Load a file with these columns to run this query."
Encoding the data itself blows past URL length limits and creates a privacy story we do
not want to defend.

**5. All query execution goes through one module.** `src/duckdb/client.ts` owns the
worker, the connection lifecycle, and the query API. UI components reach DuckDB through
it and never import the bindings themselves. This is what makes the inter-annotator
workbench reuse cheap later.

## Conventions

### TypeScript

Strictness is a build setting, not a preference: `strict` is on, plus
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noImplicitOverride`.
`tsconfig.json` is the source of truth; read it rather than assuming this list is current.

- **Types describe reality.** Data entering the tab — a parsed file, a DuckDB result
  set, anything out of storage — arrives as `unknown` and gets narrowed by a parser at
  the boundary. Past that boundary the types are trusted, because they were earned.
- **`as` is a claim you cannot back.** Use a narrowing check or a parser instead. In
  tests, reach for `@total-typescript/shoehorn` to build partial fixtures — there is a
  `migrate-to-shoehorn` skill in this repo covering the patterns.
- **`any` does not ship.** `unknown` where the shape is genuinely open, a real type
  everywhere else.
- Prefer `type` aliases; use `interface` when you need declaration merging.
- Name things after the domain, not the mechanism: a `Query` runs against a `Dataset`
  and returns a `Result`. Keep that vocabulary aligned with `CONTEXT.md`.

### File layout

The app is not scaffolded yet, so this is the target shape rather than a description
of what exists. It firms up — here — when the first application code lands.

- `src/` is application code, organised by feature rather than by file kind. A feature
  folder holds its components, logic, and tests together.
- `src/duckdb/client.ts` is the one module that touches DuckDB (decision 5). It is the
  exception to feature-first organisation, and the seam every test mocks at.
- Tests sit beside the code they cover, as `*.test.ts`.
- Repo root carries the agent-facing files: this file, `CONTEXT.md` for domain
  vocabulary, `docs/adr/` for decision records, `docs/agents/` for tooling conventions.

### Commit messages

- Imperative subject in sentence case, no `feat:`/`fix:` prefix, 72 characters or fewer.
  "Add CSV drop target", not "feat: added CSV drop target".
- Body explains why the change was needed and what it rules out. Skip it when the
  subject genuinely covers the change.
- Wrap the body at 80 characters. Bullets for more than one distinct change.
- Each commit leaves the repo working: typecheck clean, tests passing.

## Agent skills

### Issue tracker

GitHub Issues via the `gh` CLI, inferred from the `origin` remote (PeytonR72/puddle). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`.

## Installed skills

- **[mattpocock/skills](https://github.com/mattpocock/skills)**: engineering workflow skills (`tdd`, `diagnosing-bugs`, `domain-modeling`, `code-review`, `handoff`, `triage`, etc.), vendored under `.agents/skills/` and symlinked into `.claude/skills/`. Managed with `npx skills@latest`; run `npx skills update` to pull upstream changes.
- **[impeccable](https://github.com/pbakaus/impeccable)** (`/impeccable`): frontend design skill (shape, audit, critique, polish, etc.), vendored under `.claude/skills/impeccable/`. This checkout ships the skill's instructions and reference docs but **not** the compiled `impeccable` engine binary (needed for automated screenshotting/detection and the edit-time design hook) — that binary is fetched from a signed GitHub release and this environment couldn't verify/run it. The skill degrades gracefully without it (see `reference/degraded/*.md`). To get the full engine + optional pre-commit design hook, run `npx impeccable install --project --providers=claude-code` locally, or `/plugin marketplace add pbakaus/impeccable` inside Claude Code.

### Project skills

- **`frontend-design`**: design direction for this repo — ground the design in SQL and
  data, plan tokens before building, spend boldness once. Loads when working on UI.
- **`content-humanizer`**: makes copy read as written rather than generated. Loads when
  writing or editing user-facing text.
