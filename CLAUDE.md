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
