# Token plan

The vocabulary every Puddle component composes from. Written before the first component,
as the `frontend-design` skill requires. `src/index.css` is the implementation; if a value
has to be hand-written in a component, that is a gap in this plan, not a licence.

## What the subject gives us

Puddle shows result sets. The material is narrow and specific, and it hands us more than
enough to design from:

- **The ruled grid of a result set.** Rows separated by hairlines, columns aligned on
  type. This is the only structure the data actually has.
- **Monospace as the native voice.** SQL, column names, DuckDB's own type names
  (`BIGINT`, `VARCHAR`, `DATE`), row counts, millisecond timings, `NULL`. Almost every
  string in this interface is machine vocabulary, not prose.
- **Type names as typographic material.** `VARCHAR` beside a column name is real content,
  not metadata to hide behind a tooltip.
- **The engine's states.** Idle, booting, running, ready, failed. Booting is several
  megabytes of WASM and is visible; the interface has to say so honestly.
- **`NULL` is ugly and that is correct.** It is absence, and it should not be styled to
  look like a value.
- **Nothing leaves the tab.** The product's whole claim. An interface that quietly
  fetches a webfont from a third party contradicts the sentence it is rendering.

## The default we are choosing against

The templated default for a data tool is the **dashboard shell**: grey sidebar, white
content area on a subtly-tinted page, rounded cards with drop shadows, an indigo accent,
8px radius on everything. For file ingest specifically it is the **dashed rounded
rectangle with a cloud icon**, floating centred inside a card.

Puddle builds the opposite of both, for a reason that comes from the material:

- **Rules, not cards.** A result set has no cards in it. Structure comes from hairlines
  and alignment — the same device the data already uses. Cards would be a second,
  competing structure laid over the first.
- **No z-axis.** Zero shadows anywhere. A table is flat. Elevation would imply a stacking
  that does not exist.
- **The drop surface is the whole working area**, not a widget inside it. Before a file is
  loaded, ingest *is* the application, so it gets the full frame rather than a polite
  rectangle in the middle of one.

## Boldness: spent once

**The ruled monospace grid is the layout system itself.** Not a table widget living inside
a normal app — the panels, the schema list, the drop surface, and the editor frame are all
built from the same hairline rules and the same monospace, on one shared baseline. Puddle
reads like a terminal that grew up, not a dashboard with a table in it.

Everything else on the screen goes quiet to pay for it: one accent, no shadows, no
gradients, no icons that a word would do better, and prose kept to the few places where a
human sentence genuinely beats a machine one.

## Colour

One theme. v1 ships no dark mode toggle (`CLAUDE.md`), so these are committed to rather
than hedged toward a palette that could invert.

Ink on paper, with almost no chroma outside the accent. A result set is read, not
admired, and sustained reading wants high contrast and quiet surroundings.

| Token | Value | For |
| --- | --- | --- |
| `--color-paper` | `oklch(0.994 0.001 95)` | The page. Barely-warm white, not a tinted grey. |
| `--color-surface` | `oklch(0.978 0.002 95)` | Recessed areas — the schema panel, the editor frame. |
| `--color-ink` | `oklch(0.22 0.008 265)` | Primary text. Near-black, faintly cool. |
| `--color-ink-muted` | `oklch(0.52 0.008 265)` | Type names, counts, secondary voice. AA on paper. |
| `--color-ink-faint` | `oklch(0.66 0.008 265)` | Non-essential labels only; never load-bearing text. |
| `--color-rule` | `oklch(0.90 0.004 265)` | **The structural device.** Row rules, panel edges. |
| `--color-rule-strong` | `oklch(0.80 0.004 265)` | Where a boundary has to win over a row rule. |
| `--color-accent` | `oklch(0.54 0.19 245)` | One saturated azure. Deliberately not indigo. |
| `--color-accent-soft` | `oklch(0.95 0.04 245)` | Accent washes — the drag-over surface. |
| `--color-running` | `--color-accent` | The engine is working. The accent's main job. |
| `--color-failed` | `oklch(0.52 0.20 27)` | A refused file, a DuckDB error. AA on paper. |
| `--color-failed-soft` | `oklch(0.96 0.03 27)` | The wash behind a failure message. |
| `--color-null` | `--color-ink-faint` | `NULL`, set in italic. Absence, not a value. |
| `--color-mark` | `--color-ink` | **The data drawn as shape.** Bars and lines, in the grid's own ink. |
| `--color-mark-active` | `--color-accent` | The mark under the pointer. The accent's focus job, in the chart. |

The accent is rationed to two jobs: **the engine is doing something**, and **focus**. It
never decorates. If it appears anywhere else, that is a bug in the usage, not a reason to
add a second accent.

The chart is where that rule was tested, because a chart is the one place every other
tool spends its accent. Puddle does not: **the marks are ink, and the accent marks what
the pointer is on.** The reasoning is the same one that makes the grid a grid — a chart
is the result set drawn as shape rather than as digits, so it is the same data in the
same ink, and colouring it would make it read as a second subject sitting under the
first. It also leaves the accent free to do the job it already had, which is what turns
hovering a bar into an answer rather than a highlight.

Measured, ink marks sit at 16.9:1 against paper and the accent at 4.8:1, so a hovered
mark separates from its neighbours by 3.6:1 — comfortably past the 3:1 a mark needs.
Axis ticks are `--color-ink-muted` rather than `--color-ink-faint`: they are how the
plot is read, which makes them load-bearing text, and faint clears AA only for labels
that are not.

### Syntax highlighting spends no colour at all

The query editor is the obvious place a second palette would arrive — every SQL editor
paints `SELECT` blue — so it is written down here rather than left to the component.

Highlighting is drawn entirely from the ramp above: keywords, type names and function
names in `--color-ink-muted`, operators and punctuation in `--color-ink-faint`, comments
faint and italic, `NULL` faint and italic like the cell that holds it, and literals in
full `--color-ink`. On top of that, an identifier naming a column of the loaded file is
set at weight 500.

The effect is an inversion worth keeping: the scaffolding recedes and the columns come
forward, which is the right way round for a notebook, where the columns are the subject.
It is also what makes a mistyped column name visible before the query runs — `amont` stays
plain while `amount` does not. The caret is the only accent in the editor.

## Type

**System stacks only, no webfont.** This is a design decision with a product reason: a
webfont is a third-party request, and Puddle's central claim is that nothing leaves the
tab. Shipping a font from a CDN to render the sentence "your data never leaves the
browser" would be a lie in the network panel.

| Token | Stack |
| --- | --- |
| `--font-mono` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` |
| `--font-sans` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif` |

Mono is the interface voice and carries the majority of the text: column names, types,
SQL, counts, timings, file names, buttons. Sans is for prose only — an explanation, an
error's human half, the landing copy. The split is not decorative: mono means *this
string came from or goes to the engine*, sans means *a person wrote this to you*.

The scale steps tighter and denser than a marketing page, because result sets want
density. Base reading size is 13px, not 16px, and that is deliberate.

| Token | Size | Steps at |
| --- | --- | --- |
| `--text-micro` | `0.6875rem` / 11px | Type names, byte counts, uppercase section labels |
| `--text-small` | `0.75rem` / 12px | Row counts, timings, secondary mono |
| `--text-base` | `0.8125rem` / 13px | **The notebook's reading size.** Column names, SQL, controls |
| `--text-body` | `0.9375rem` / 15px | Prose sentences |
| `--text-lead` | `1.125rem` / 18px | The one-line invitation on an empty surface |
| `--text-display` | `1.75rem` / 28px | Section headline |
| `--text-hero` | `2.75rem` / 44px | Landing wordmark |
| `--text-editor-touch` | `1rem` / 16px | The query editor, on a touch device only |

`--text-editor-touch` is the one size that is not a step in the scale, and it exists for
a mechanical reason rather than a typographic one: iOS zooms the page when a field under
16px takes focus, which lands the caret off-screen and leaves the layout pinched. 13px is
right for the editor on a pointer device, so the size changes under
`@media (pointer: coarse)` and nowhere else. `--row-height` does not change with it, so
the ruled grid holds at both sizes.

Weights: 400 for everything, 500 where a column name has to separate from what surrounds
it — its type in the schema panel, the SQL around it in the editor — and 600 reserved for
the wordmark. Uppercase section labels take `0.08em` tracking at `--text-micro`; nothing
else is uppercased.

## Space

Base unit 4px. Density is the point, so the scale starts tight and the useful steps are
the small ones.

`--space-1: 4px` · `--space-2: 8px` · `--space-3: 12px` · `--space-4: 16px` ·
`--space-6: 24px` · `--space-8: 32px` · `--space-12: 48px` · `--space-16: 64px`

`--row-height: 28px` — one schema row, and one result row. A fixed row height is what
makes the grid a grid and what makes virtualization honest. The results table needs this
one as a number rather than as a length, because a virtualizer places rows by arithmetic
before anything is laid out; `src/results/metrics.ts` is that copy, and the two move
together.

`--head-height: 44px` — the results grid's sticky header. Taller than a row because it
carries two lines, a column's name over its type, and because the edge between the header
and the data is the one boundary in the grid worth feeling.

`--editor-height-split: 34%` — how much of the working column the SQL keeps once its
answer is under it. Fixed rather than fitted: a panel that resizes itself around each
result moves the caret every time a query runs.

`--panel-width: 260px` — the schema panel beside the editor. Wide enough for a real column
name at 13px mono, narrow enough that the editor keeps the width it needs.

`--panel-height-stacked: 40dvh` — what that panel collapses to below `md`, where it sits
above the editor instead of beside it. A cap rather than a height, so a two-column file
does not reserve space it has no use for. `dvh` rather than `vh` so an on-screen keyboard
takes its space out of the schema list and not out of the SQL being typed.

`--chart-height: 200px`, and `272px` from `md` up — the band the chart takes at the foot
of the working column. **Its plot is measured in result rows**: five of them on a phone
and eight once there is width, plus the row of controls above. Measuring a chart in rows
is the same move as everything else here — it keeps the plot on the grid's rhythm instead
of introducing a second one. Fixed rather than fitted, for the reason the editor's split
is: a panel that resizes itself around each result moves everything above it every time a
query runs. What the chart takes comes out of the grid above it, which is why the phone
gets the smaller number.

## Radius, border, elevation

- `--radius-none: 0` — **the default.** Panels, rows, the drop surface, the editor frame.
  Grid surfaces have square corners because cells do.
- `--radius-control: 2px` — interactive controls only. Just enough to read as pressable.
  Nothing in Puddle gets 8px.
- `--border-hairline: 1px` — the single structural weight, drawn in `--color-rule`. This
  is the table rule doing the work borders and shadows usually do.
- **Elevation: none.** No `box-shadow` token exists, so none can be spent by reflex. The
  focus ring is a ring, not a shadow.

## Chart marks

The chart is drawn into SVG, and an SVG attribute cannot take a CSS length that has not
been resolved, so these lengths exist twice — here, and as numbers in `src/chart/marks.ts`.
The pair moves together, the way `--row-height` and `src/results/metrics.ts` do. Colours
are not copied: SVG resolves `var(--color-mark)` perfectly well.

| Mark | Spec | Why |
| --- | --- | --- |
| Bar | `--color-mark`, **24px cap**, 4px radius on the reading end only | A bar that fills its slot makes a solid block. Capped, the leftover is the gap, and the gap is what separates one bar from the next. |
| Line | `--color-mark`, **2px**, round join | Thin enough to read as a line, thick enough to follow across a gap left by a `NULL`. |
| Active mark | `--color-mark-active`, 2px `--color-paper` ring on the dot | The ring keeps an 8px dot legible where the line runs under it. |
| Gridlines | `--color-rule`, horizontal only, **solid hairline** | The same rule the table draws its rows with. Never dashed: a dashed grid reads as a projection or a threshold when it is neither. |
| Axis line | `--color-rule-strong` on x, none on y | One baseline. The y values are already carried by the gridlines. |
| Axis ticks | `--color-ink-muted` at `--text-micro` | Load-bearing text, so not `--color-ink-faint`. |

**Nothing in the chart animates.** Not the bars growing on a run, not the line drawing
itself. The rule from Motion below holds here without an exception: layout does not
animate, and a chart that replays its entrance every time a query runs is decoration
charged to the reader's attention.

A single series takes **no legend** — there is one colour on the plot, and the two selects
above it already name both axes. A box with one swatch in it would restate them.

## Motion

- `--ease-out: cubic-bezier(0.2, 0, 0, 1)` — the only easing curve.
- `--duration-fast: 120ms` — hover, focus, control state.
- `--duration-surface: 240ms` — the drop surface answering a drag.
- Determinate progress moves **linearly**, not eased. An eased progress bar misreports the
  download rate, and the DuckDB boot is the one place a stranger is watching a number they
  cannot verify. Honesty beats polish here.

What animates: the drop surface's state, progress width, focus rings. What does not: row
hover (instant reads as more responsive at this density), layout, text.

All of it collapses under `prefers-reduced-motion: reduce`.

## Accessibility floor

Not a token, but checked against the same plan: every text colour above meets WCAG AA on
the surface it is used on, focus rings are visible on every interactive element and never
removed, and the keyboard path works without a pointer — the schema list is reachable and
each column inserts on `Enter` or `Space`.
