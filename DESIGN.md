---
name: Puddle
description: A browser-local SQL notebook whose first screen is a herbarium specimen sheet.
colors:
  mount: "oklch(0.872 0.003 120)"
  sheet: "oklch(0.963 0.003 120)"
  sheet-inset: "oklch(0.938 0.004 120)"
  specimen: "oklch(0.36 0.036 140)"
  specimen-faint: "oklch(0.52 0.02 140)"
  stamp: "oklch(0.44 0.204 305)"
  stamp-soft: "oklch(0.95 0.03 305)"
  paper: "oklch(0.994 0.001 95)"
  surface: "oklch(0.978 0.002 95)"
  ink: "oklch(0.22 0.008 265)"
  ink-muted: "oklch(0.52 0.008 265)"
  ink-faint: "oklch(0.66 0.008 265)"
  rule: "oklch(0.9 0.004 265)"
  rule-strong: "oklch(0.8 0.004 265)"
  accent: "oklch(0.54 0.19 245)"
  accent-soft: "oklch(0.95 0.04 245)"
  failed: "oklch(0.52 0.2 27)"
  failed-soft: "oklch(0.96 0.03 27)"
typography:
  display:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: "2.125rem"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.14em"
  body:
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
    fontSize: "0.8125rem"
    lineHeight: "1.25rem"
    fontFeature: "tabular-nums"
  label:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.6875rem"
    lineHeight: "1rem"
    letterSpacing: "0.18em"
    fontVariation: "'wdth' 84"
  mono-micro:
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
    fontSize: "0.6875rem"
    lineHeight: "1rem"
    fontFeature: "tabular-nums"
rounded:
  square: "0px"
  control: "2px"
spacing:
  base: "4px"
  tight: "12px"
  field: "20px"
  column: "28px"
  sheet: "40px"
components:
  stamp-accession:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.stamp}"
    typography: "{typography.title}"
    rounded: "{rounded.square}"
    padding: "12px 24px"
  stamp-accession-hover:
    backgroundColor: "{colors.stamp-soft}"
    textColor: "{colors.stamp}"
  button-file-quiet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  button-file-quiet-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  button-file-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  button-file-primary-hover:
    backgroundColor: "{colors.ink-muted}"
    textColor: "{colors.paper}"
  label-determination:
    backgroundColor: "{colors.sheet-inset}"
    textColor: "{colors.ink}"
    typography: "{typography.mono-micro}"
    rounded: "{rounded.square}"
    padding: "12px 16px"
  block-collection:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.mono-micro}"
    rounded: "{rounded.square}"
    padding: "12px 16px"
  app-header:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "8px 16px"
---

# Design System: Puddle

## Overview

**Creative North Star: "The Herbarium Specimen Sheet"**

Puddle's first screen is a sheet of cool archival stock resting on a darker grey mount.
The bundled dataset arrives already mounted, determined, and labelled: four categories
pressed as weekly-mean traces on hairline baselines, a bordered determination label
naming what was examined and what was transmitted, and one aniline-violet accession
stamp reading `EXAMINE`, which is both the collection's mark and the only button on
the page. The world exists to make a claim checkable rather than asserted: a herbarium
is the one document type whose whole job is provenance, and provenance is Puddle's
entire pitch.

The system is flat, ruled, and close-set. Structure comes from hairlines and alignment
because that is the only structure a result set actually has; nothing is a card, nothing
is a gradient, and the one shadow in the build is the lift of the sheet off its mount,
the world's own material, not an elevation vocabulary. Density is tight (4px base) and
type is small: 11–13px carries almost everything, with the wordmark at 44px as the single
large thing on the page. Every label is condensed caps; every measured value is mono with
tabular figures.

The world is deliberately not the developer-tool landing page it replaces: no hero
headline, no glassy code block, no gradient bloom, and deliberately not cream, parchment
or lamplight. This is a working herbarium, not an antique. The rest of the app (schema
panel, editor, results grid, chart) keeps the incumbent ink-on-paper grid system, whose
density, type and behaviour are pinned; the sheet's tokens extend that vocabulary rather
than replacing it. `docs/design/tokens.md` holds the per-token reasoning and the measured
contrast ratios; this file is the applied system.

**Key Characteristics:**
- Cool archival sheet on a darker mount; never cream, parchment, or lamplight
- Hairlines and alignment as the only structural device: no cards, no panels-as-boxes
- Herbarium green for the subject, one aniline violet spent exactly once
- Condensed caps for every label, monospace with tabular figures for every measured value
- Square corners everywhere except 2px on controls; one rotated element per screen
- One authored motion: the specimen draws itself once, linear, then nothing moves

## Colors

Two families share one screen: a green-grey herbarium world for the sheet, and the
incumbent cool ink-on-paper world for the working surface it hands off to.

### Primary
- **Aniline Violet** (`stamp`): the ink a collection actually stamps an accession with.
  It appears on exactly one element (the `EXAMINE` stamp) plus the reading hairline
  that follows the pointer down a specimen, the sheet's drag-over border, and the browser
  surfaces (`accent-color`, `caret-color`). It is the only saturated thing on the first
  viewport.
- **Violet Wash** (`stamp-soft`): the stamp's hover fill, the drag-over ground, and the
  document's `::selection` background. Never a text colour.

### Secondary
- **Azure** (`accent`): the working surface's one saturated colour: focus rings, the
  boot progress bar, the running query, the mark under the pointer in the chart. It never
  appears on the specimen sheet, and the stamp never appears on the working surface.
- **Azure Wash** (`accent-soft`): the drop-to-replace overlay over a loaded dataset.

### Tertiary
- **Herbarium Green** (`specimen`): the ink of the subject. Every specimen trace, the
  mounted fragment of first rows, and each specimen's printed mean. Spent freely: it is
  the material's colour, not an accent to be rationed.
- **Green-Grey Label** (`specimen-faint`): specimen names, ranges, section labels, the
  sheet's subtitle and footer. Tinted from the specimen's own hue rather than greyed, and
  held to the body-text contrast floor because it carries 11–12px text (4.91:1 on the
  sheet, 4.56:1 on the inset, measured; see `docs/design/tokens.md`).

### Neutral
- **Mount Grey** (`mount`): the ground behind the sheet. It is what makes the sheet read
  as an object rather than a page background, and it is the only place it is used.
- **Archival Stock** (`sheet`): the sheet itself, and the collection block pasted to it.
- **Inset Stock** (`sheet-inset`): one step down from the sheet: the determination label
  only, so the label reads as pasted on rather than printed in.
- **Paper** (`paper`) / **Surface** (`surface`): the working application's page and its
  recessed areas (schema panel, editor frame).
- **Ink** (`ink`) / **Ink Muted** (`ink-muted`) / **Ink Faint** (`ink-faint`): primary
  text, secondary voice, and non-essential labels. `ink-faint` is never load-bearing.
- **Rule** (`rule`) / **Rule Strong** (`rule-strong`): the structural device. Baselines,
  row rules, panel edges, and the scrollbar thumb; `rule-strong` where a boundary has to
  win over a row rule.
- **Refusal Red** (`failed`) / **Refusal Wash** (`failed-soft`): a refused file or a
  DuckDB error, as a left-bordered notice.

### Named Rules

**The One Stamp Rule.** The violet is spent once per screen. `EXAMINE` is the only
saturated element and the only rotated element on the sheet; a second violet mark halves
the first. Audit test: count the saturated marks above the fold. More than one is a bug.

**The Two Inks Rule.** Green belongs to the specimen, azure belongs to the working
surface. Neither crosses. Colouring a focus ring violet or a trace azure tells the reader
the two worlds are the same kind of thing, and they learn nothing from either.

**The Tinted Grey Rule.** A faint text colour is a tint of its own family's hue, never a
neutral grey dropped in. `specimen-faint` is green; `ink-faint` is cool.

## Typography

**Display Font:** Archivo Variable (self-hosted, same-origin; falls back to `ui-sans-serif`,
`system-ui`)
**Body Font:** Archivo Variable, for prose and labels
**Label/Mono Font:** the platform monospace stack (`ui-monospace`, `SF Mono`, Menlo,
Consolas), carrying every measured value

**Character:** Archivo is a grotesque cut for print and forms, which is the register a
determination label is actually set in, and it ships with the app rather than arriving
from a CDN, because the product's one claim is a fact about the network panel. The
monospace is the data's own voice: SQL, type names, row counts, timings, dollar figures.
The pairing is a printed form beside a machine readout.

### Hierarchy
- **Display / wordmark** (700, 2.75rem, line-height 1, tracking −0.03em): `puddle` at the
  head of the sheet, lowercase and fixed. The only large type in the build.
- **Headline** (700, 1.75rem, 2.125rem): available for a working-surface heading; unused
  on the first viewport.
- **Title / stamp** (700, 1.125rem, line-height 1, tracking 0.14em, condensed caps):
  the `EXAMINE` stamp face. The one place a label is set large.
- **Body** (1.125rem lead / 0.9375rem body / 0.8125rem base, monospace, tabular figures):
  the working surface's running voice: invitations, prose, button faces, and every
  number the reader is meant to compare.
- **Label** (0.6875–0.75rem, condensed caps at `'wdth' 84`, tracking 0.06em–0.2em): every
  named field on the sheet. Tracking rises with importance: 0.06em on a field name inside
  a label block, 0.14em on a specimen name, 0.16em in the footer, 0.18em on section
  headings, 0.2em on a block's own heading.

### Named Rules

**The Condensed Caps Rule.** A label is set in the `label-caps` voice: Archivo at width
84, uppercase, tracked at 0.06em or wider. A herbarium sets its labels narrow because a
determination has to fit a small printed slip, and that proportion is most of what makes
the lettering read as a collection's rather than an app's.

**The Measured Value Rule.** Anything measured (a date, a mean, a range, a row count, a
millisecond timing) is monospace with tabular figures, which is set on `body` so figures
align by default rather than per component. A number in the sans face is a mistake.

**The One Wordmark Rule.** `puddle` appears once per screen, lowercase, never restyled.
The application header is suppressed entirely while the sheet is showing, because the
sheet already carries the wordmark at the size a collection prints its own name.

## Layout

The spacing rhythm is a 4px base, kept tight because result sets want density. The first
viewport is a sheet inset on the mount by 20px (32px from the `sm` breakpoint), with the
sheet's own padding at 28px/32px (40px from `sm`), so the mount is visible on every edge
at every width.

The sheet's vertical structure is fixed: wordmark, subtitle, a full-width 1px ink rule
20px below, then the body 20px under that, then a 40px gap to the footer. The body is a
single column until `lg` (1024px), where it becomes two: the specimen column takes the
remaining width and a 19rem aside holds the determination label, the collection block,
and the stamp. Column gap is 28px stacked, 40px side by side.

Reading order is reversed against source order on purpose. The aside is `order-first`
when stacked so the stamp, the one action, leads on a phone, and moves to the right at
`lg` where the sheet's data-first reading order can hold. The specimen rows do the same
thing at `sm` (640px): the category name and range sit above and below the trace on a
phone, and flank it once there is width, because 80px of label on each side would leave
the trace a third of the sheet.

The working surface behind it is a different model and unchanged: a shrink-to-fit schema
panel beside a column that splits into a fixed-share editor (34%), an elastic results
grid, and a fixed chart band. Its lengths (`--row-height` 28px, `--head-height` 44px,
`--panel-width` 260px) are pinned and out of this system's scope.

### Named Rules

**The Action-First Stack Rule.** When the sheet's two columns collapse, the determination
and its stamp move to the top. A phone that buries the one button under four traces fails
the bar the product is measured against.

## Elevation & Depth

The system is flat and uses tonal layering: mount, sheet, inset. There is exactly one
shadow in the build, and it is the sheet's own lift off its mount: an offset hairline
plus a wide soft blur, so the sheet reads as an object resting on a darker ground rather
than a div with a border. Nothing else in the build casts one: not the determination
label, not the stamp, not a button, not the working surface's panels. Focus is a ring,
never a glow, because there is no elevation budget to spend on it.

### Shadow Vocabulary
- **Sheet lift** (`box-shadow: 0 1px 0 var(--color-rule), 0 14px 34px -12px rgb(0 0 0 / 0.22)`):
  the mount-to-sheet relationship, and only that. One instance per screen.

### Named Rules

**The One Lift Rule.** The sheet is the only element that leaves the ground. Depth
elsewhere is a tonal step or a hairline. A shadow on a second element turns a mounted
specimen into a dashboard of floating cards.

## Shapes

Square by default, because grid cells are. The sheet, the determination label, the
collection block, the mounted fragment and the accession stamp all have hard corners;
only interactive controls take a 2px radius (`rounded-control`), which is small enough to
read as a machined edge rather than a softened one.

Borders are 1px hairlines and carry all the structure: ink for the sheet's header rule and
the determination label's frame, `rule-strong` for the collection block, `rule` for a
specimen baseline, and a single left hairline for the mounted fragment, a mounting strip,
not a thick coloured bar. The accession stamp is the exception at 2px, because a stamp is
pressed harder than a label is ruled.

One element is rotated: the stamp, at −4°, straightening to 0° on hover and focus. A
specimen trace is a 1.4px non-scaling stroke on a viewBox that reaches 14 units above the
drawn range, so a peak stops short of the specimen above it; adjacent traces crossing each
other's baselines would read as one tangled plant rather than four mounted ones.

### Named Rules

**The Square Corner Rule.** Corners are square unless the element is a control, in which
case 2px. There is no third radius.

**The Hairline Rule.** Structure is 1px. When a boundary needs to win, change its colour
(`rule` → `rule-strong` → `ink`), not its weight. The two exceptions are the stamp's 2px
frame and a failure notice's 2px left border.

## Components

### Accession Stamp (signature)
The primary action, and the collection's mark. A −4° rotated rectangle framed in 2px
violet on the sheet's own stock, carrying `EXAMINE` in condensed caps at 1.125rem over a
micro line reading `Runs here · no upload`.
- **Shape:** square corners, 2px violet border
- **Padding:** 12px 24px
- **Hover / Focus:** straightens to 0° and fills with the violet wash, over 120ms on the
  house ease. Focus-visible straightens without the fill.
- **Rule:** one per screen, and it is the only rotated thing on it.

### Determination Label (signature)
Live instrumentation, not decoration. A bordered definition list on inset stock with its
heading ruled off beneath it, set as a `5.5rem` label column against a monospace value
column. At rest it describes the sheet (dataset, source, rows, columns, engine,
transmitted: `nothing`); under the pointer it describes one week (week of, category, mean,
reading *n* of 72). It is one block that changes, never a block plus a tooltip.
- **Border:** 1px ink, on `sheet-inset`
- **Internal padding:** 12px 16px; 12px 6px grid gaps
- **Accessibility:** the block is not itself a live region; a visually hidden polite
  region announces only the settled reading, 350ms after the reader stops moving.

### Collection Block
The same frame, one step quieter: 1px `rule-strong` on sheet stock, carrying facts derived
from the specimen data (span, weeks, specimens, reduction applied) rather than asserted
beside it. It reads as subordinate to the determination because its border is grey where
the determination's is ink.

### Specimen Trace (signature)
A category name in condensed caps, a full-width SVG trace in herbarium green on a hairline
baseline, and its range over its mean in monospace. Each specimen is scaled inside its own
range, and the range is printed so the scaling is stated rather than hidden.
- **Interaction:** the whole field is a button. The pointer reads as it moves and drops a
  1px violet hairline down the trace; the keyboard steps a week with the arrows, jumps
  with Home/End, and takes the reading on Enter or Space. Activating writes that week's
  `WHERE` clause into the editor and runs it.
- **Cursor:** crosshair. **Focus:** a 2px violet outline offset 2px.

### Buttons
- **Shape:** 2px radius (`rounded-control`), 1px border, 6px 12px padding, monospace face
  at 0.8125rem
- **Primary:** ink fill, paper text; hover lightens both border and fill to `ink-muted`
- **Quiet:** paper fill, `rule-strong` border, ink text; hover moves to `surface` with an
  `ink-muted` border. This is the variant the sheet uses, so it never competes with the
  stamp.
- **Focus:** a 2px azure ring offset 1px, visible on every interactive element and never
  removed. On a file button the real `<input>` stays focusable and `sr-only`, and the
  label carries the ring.

### Mounted Fragment
The dataset's first rows as a preformatted monospace block in herbarium green, with a
single left hairline standing in for a mounting strip. Its own condensed-caps label sits
above it. It is evidence, so it is the file's actual first rows.

### Navigation
There is no navigation. The application header is a single 1px-ruled bar carrying the
wordmark at body size beside the loaded file name in condensed caps, with the copy-link
control at the right once a dataset exists. It is suppressed entirely on the first
viewport.

### Drag-Over State
The whole sheet is the drop target. On drag-over the sheet's border goes violet and its
ground goes to the violet wash, over 240ms. Over a loaded dataset the overlay is the azure
pair instead, because that surface belongs to the working world.

## Do's and Don'ts

### Do:
- **Do** put every label in the condensed-caps voice (`label-caps`: Archivo at `'wdth' 84`,
  uppercase, tracked 0.06em or wider) and every measured value in monospace with tabular
  figures.
- **Do** build structure from 1px hairlines and alignment, and escalate a boundary by
  colour (`rule` → `rule-strong` → `ink`) rather than by weight.
- **Do** spend the aniline violet exactly once per screen, on the single primary action.
- **Do** keep the specimen green for the subject and the azure for the working surface.
- **Do** derive every field on a label from the data it describes, so the block cannot
  drift from the traces above it.
- **Do** keep corners square, with 2px reserved for controls.
- **Do** let the mount show on all four edges of the sheet at every width.
- **Do** ship the display face from the same origin as the app, and check that a new
  surface adds no third-party request.
- **Do** make the keyboard path complete on any surface that responds to a pointer:
  stepping, jumping to the ends, and activating.

### Don't:
- **Don't** put a shadow on anything but the sheet's lift off its mount. The determination
  label, the stamp, and every panel are flat.
- **Don't** rotate a second element. The stamp's −4° is the screen's only tilt.
- **Don't** use cream, parchment, sepia, or a warm lamplight ground. The sheet is cool
  archival stock.
- **Don't** introduce a glyph icon set. Nothing in this build uses one; a word, a rule, or
  a plotted trace does the work, and the favicon is the dataset's own trace rather than a
  drawn mark.
- **Don't** add a third bordered definition-list block beside the determination and the
  collection. Two read as a sheet's labels; three read as a stack of cards, which this
  system refuses.
- **Don't** invent evidence to fill a slot. A block with nothing real to say is cut, not
  populated with plausible-looking examples.
- **Don't** ease the survey animation or animate anything else on the sheet. The trace
  draws itself linearly, once, and then the page is still.
- **Don't** show the application header and the sheet on the same screen; one `puddle` per
  viewport.
- **Don't** hand-write a colour, length, or duration in a component. Extend
  `src/index.css` and record the reasoning in `docs/design/tokens.md`.
