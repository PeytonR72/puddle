# Puddle

Puddle is a browser-local SQL notebook built on DuckDB-WASM. You open a page, drop in
a CSV or Parquet file, and write SQL against it in a notebook of cells that run in
order and show their results inline. Everything — the engine, the data, the notebook
itself — stays in the browser tab. There is no backend, no accounts, and no API keys.

## v1 scope

<!-- PASTE: in-scope list -->

**In scope**

- _Awaiting the v1 in-scope list._

**Out of scope**

- _Awaiting the v1 out-of-scope list._

<!-- END PASTE -->

Until those lists land, treat every feature as undecided and ask before building it.
Once they land, they are the boundary: work that is out of scope stays out until the
lists change, and the lists change by editing this file, not in passing conversation.

## Architecture decisions (locked)

<!-- PASTE: the five locked decisions -->

_Awaiting the five locked architecture decisions._

<!-- END PASTE -->

"Locked" means these are settled and not reopened by an implementation that finds them
inconvenient. When a decision genuinely blocks the work, stop and say so — the fix is
to change the decision here, with a note in `docs/adr/`, not to route around it in code.

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
- Name things after the domain, not the mechanism: a `Cell` runs, a `Notebook` holds
  cells. Keep that vocabulary aligned with `CONTEXT.md`.

### File layout

The app is not scaffolded yet, so this is the target shape rather than a description
of what exists. It firms up — here — when the first application code lands.

- `src/` is application code, organised by feature rather than by file kind. A feature
  folder holds its components, logic, and tests together.
- DuckDB is reached through one module. Nothing else imports the WASM bindings
  directly, so the engine stays swappable and mockable.
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
