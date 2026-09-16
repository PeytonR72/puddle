---
version: 1
slug: "src-dataset-workbench-tsx"
primary_target: "src/dataset/Workbench.tsx"
related_targets: ["src/dataset/DropZone.tsx","src/index.css"]
---

Scope: Puddle's first viewport and shell — the screen a stranger meets, and the
chrome around the workbench. Visitor mode: Persuade. The results grid keeps its
own system (density, type, behaviour) by the user's pinned instruction.

Audience: a hiring reviewer reading Puddle as evidence of how its author works;
secondarily a technical person with a CSV. Action: stamp EXAMINE and watch a real
query run with no file of their own. Proof: the bundled 2,000-row synthetic
dataset, and a determination label naming what was examined and what was
transmitted. Constraints: no third-party runtime requests, self-hosted face
permitted, wordmark `puddle` lowercase and fixed.

## Direction contract

THESIS: Puddle's first screen is a herbarium specimen sheet — the dataset arrives
mounted, determined, and labelled. It refuses the developer-tool landing page
(hero headline, glassy code block, gradient bloom) and the bare drop zone it
replaces.

OWN-WORLD: A cool archival sheet on a grey mount — never cream, parchment, or
lamplight. Herbarium green for specimen traces and baselines. One aniline-violet
accession stamp, rotated, spent once per screen. A bordered determination label
ruled under its heading; pale annotation slips with hairline borders. Square
corners, hairline rules, no elevation but the sheet's own lift. Condensed caps
widely tracked for labels; mono for every measured value.

STORY: A stranger sees a working tool already holding real data, believes the
engine is in their tab because the determination label says what was examined and
that nothing left, and stamps EXAMINE to run the survey without supplying a file.

FIRST VIEWPORT: Sheet inset on a grey mount, filling the viewport. Wordmark at
46px above a full-width header rule; collection meta right-aligned opposite it.
Below the rule, four category specimens as weekly-mean traces, each scaled to its
own range, on hairline baselines — category in condensed caps left, min–max and
mean in mono right. Right column: annotation slips stacking prior queries, then
the bordered determination label. The accession stamp sits below the label,
rotated, and is the primary action. A mounted fragment of the first rows anchors
lower-left; accession and terms lines foot the sheet.

SIGNATURE INTERACTION: determination follows the pointer. Moving along a specimen
runs a hairline down it and rewrites the determination label to that week's
reading; the label is live instrumentation, never decoration. Activating a point
writes its WHERE clause into the editor, so the landing surface is the query
builder rather than a picture of one.

MOTION GRAMMAR: the specimen draws itself once, left to right in survey order,
linear rather than eased — matching the locked decision that boot progress is
determinate and unembellished — staggered per stalk. Nothing else animates. Under
`prefers-reduced-motion: reduce` the traces are present complete.

FORM: Herbarium specimen sheet. Candidate 7 of 7 on the re-rolled grounded list,
assigned by seed key 73d242ac (re-roll 1). Code-led: no image generation exists in
this environment, so the comp round is skipped by contract and the ambition rides
in FIRST VIEWPORT and the named signature interaction.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Self-hosted face not yet chosen; the mockup used system stacks as placeholder.
- The roll ran degraded both rounds (challenger service proxy-blocked): no catalog
  challengers, no quality-bar boards, so no challenger raises are recorded here.
