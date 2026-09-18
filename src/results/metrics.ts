/**
 * The grid's fixed measurements, as numbers.
 *
 * They mirror `--row-height` and `--head-height` in `src/index.css`, where the
 * reasoning for both values lives. They exist a second time here because a
 * virtualizer works in arithmetic: it decides which rows exist and where they
 * sit before any of them is laid out, so it cannot ask the browser what a CSS
 * variable resolved to. The table draws itself from these numbers as well as
 * measuring with them, so the two cannot disagree on screen, but the schema
 * panel still sizes its rows from the token, and that is the pair to keep in
 * step if either changes.
 */

/** One result row. The same height as one schema row: it is the same grid. */
export const ROW_HEIGHT = 28

/** The sticky header, which stacks a column's name over its type. */
export const HEAD_HEIGHT = 44
