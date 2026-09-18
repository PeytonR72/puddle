---
name: frontend-design
description: Design direction for Puddle's interface. Use when building or changing UI, choosing colour, type, spacing or motion, defining tokens, or judging whether a screen looks generic.
---

# Frontend design

Direction, not process. `/impeccable` covers the craft loop: audit, critique, polish.
This skill decides what Puddle should look like, and holds every UI decision to it.

Puddle is a SQL notebook that runs entirely in a browser tab. The person using it is
reading result sets, not admiring chrome. Design that earns its place makes data easier
to read; design that competes with the data is a bug.

v1 has five surfaces to design: the landing page with its preloaded live demo, the file
drop, the schema panel beside the editor, the results table, and the chart below it.
`CLAUDE.md` holds the scope boundary for each.

**The desktop is the primary case.** Design and check the wide layout first; `CLAUDE.md`
holds the done bar it has to clear. The schema panel beside the editor is the arrangement
Puddle is built around, not a widescreen bonus.

Phones still have to work. Decide what each wide arrangement collapses to (the panel, the
results table, the chart) while you design it, rather than discovering it at 380px later.

## Two readers

One reader is querying a CSV. The other is an employer, reading Puddle as evidence of how
its author works. This is portfolio work and it gets judged as such, so the second reader
is a real constraint, not a flourish on top of the first.

They want the same thing more often than not. What reads as senior is never ornament: it
is one opinion held consistently across every surface, and the states nobody asks for done
properly: focus rings, empty states, the error a bad query produces, a `NULL` that reads as
absence rather than a gap. Slop in those is what reads as junior, and no amount of polish
elsewhere covers for it.

So **clean means executed without slop, not timid.** A safe screen is not a neat one; it is
a screen with nothing to say, and a reviewer reads an absent opinion faster than a wrong
one. Spend the boldness budget below: hedging it is the expensive mistake here, not the
risky one.

## Ground the design in the subject

**Ground** means the visual language comes from the material (SQL, tabular data, local
computation) rather than from whatever a dashboard usually looks like.

Before choosing anything, write down what the subject gives you. For Puddle that well is
deep: the grid of a result set, monospace as the native voice of query text, the
idle/running/error states of a query, the honest ugliness of a `NULL`, row counts and
timings as real typographic material, the fact that nothing leaves the machine.

Each of those is a design move waiting to be made. The grid can be the layout system
instead of a widget inside it. Query timing can be set in the same type as the query.
Local-only can be something the interface shows rather than a line of copy claiming it.

The test: could this screen be lifted onto a CRM without anyone noticing? If yes, it is
not grounded: go back to the material and find the detail only a SQL notebook has.

## Plan tokens before building

Write the token plan first, as a short document. Building UI before the plan produces
values chosen ad hoc and reconciled never.

The plan names, and gives the reasoning for:

- **Colour**: a neutral ramp, one accent, and the semantic set the notebook genuinely
  needs (running, succeeded, failed, `NULL`). Say what each is for. v1 ships one theme
  (no dark mode toggle) so commit to it rather than hedging toward a palette that could
  invert later.
- **Type**: the families (a monospace carrying real weight here; it is the notebook's
  voice, not just code styling), the scale, and where the scale steps.
- **Space**: one base unit and the scale built from it. Density is a design decision;
  make it deliberately, because result sets want tighter rhythm than marketing pages.
- **Radius, border, elevation**: the flat values, and which surfaces get them.
- **Motion**: durations and easing, and which state changes animate at all.

Every token gets a reason tied back to the subject. A token whose reason is "looks good"
is a default in disguise. Land the plan before the first component.

Once tokens exist they are the vocabulary: components compose them, and a value that has
to be hand-written in a component means the plan has a gap. Fill the gap in the plan.

## Retire the templated default

A **templated default** is a choice made by habit rather than by decision: the palette
every starter ships with, the indigo-to-purple gradient, the 8px radius on everything,
the three evenly weighted cards, the hero with a centred headline and two buttons, the
sidebar that exists because apps have sidebars.

Name the default, then choose against it deliberately. For each major choice, write the
obvious version, then the version the subject argues for, and build the second unless the
first genuinely wins on the merits.

Two habits carry most of the weight:

- **Hierarchy through contrast, not decoration.** Size, weight, and space separate things
  more honestly than borders and shadows. Reach for a divider after those run out.
- **Layout follows the reading.** Ask what the eye needs first in a notebook: the query,
  then its result, then its cost, and let that ordering set the layout.

## Spend boldness once

Every screen gets one **boldness budget**, and it buys exactly one thing: the move
someone would describe if they told a colleague what Puddle looks like. A typographic
scale that goes further than expected. A result grid with genuine presence. One
saturated accent in a field of neutrals. A transition that makes query execution legible.

Choose it explicitly, name it in the token plan, and make it unmistakably strong: a
boldness hedged into safety spends the budget and buys nothing.

Everything else on that screen then goes quiet and gets out of its way. Two bold moves
compete and both read as noise, which is the failure this rule exists to prevent.

## Before calling UI done

- The token plan exists, and the built UI uses it with no hand-written values.
- The boldness is identifiable in one sentence, and it is the only one on the screen.
- Every choice traces to the subject or to an explicit decision against the default.
- Contrast meets WCAG AA, focus states are visible, and the keyboard path through a
  app (insert a column from the schema panel, write a query, run it with Cmd/Ctrl+Enter)
  works without a mouse.
- It holds up with real data: a wide result set, a thousand rows, a `NULL`-heavy column,
  a column of long strings, a query that errors, a result that charts badly, and the
  empty state before any file is loaded.
- The two states the architecture forces are designed, not defaulted: the determinate
  progress shown while DuckDB boots on first intent, and the read-only query plus expected
  column list shown when someone opens a share link with no file loaded. Both are a
  stranger's first screen, so neither is a spinner.
- Nothing on the screen is slop: no misaligned edge, no inconsistent spacing step, no
  state that was left to the browser's default. A reviewer finds these before they find
  the good decisions.
