/**
 * The chart's fixed measurements, as numbers.
 *
 * They mirror the "Chart marks" section of `docs/design/tokens.md`, where the
 * reasoning lives, and they exist a second time here for the same reason
 * `src/results/metrics.ts` does: the chart is drawn into SVG attributes, and an
 * SVG attribute cannot be given a CSS length that has not been resolved yet.
 * The colours stay as `var(--color-…)` (those SVG *does* resolve) so only the
 * lengths are copied.
 */

/**
 * A bar never fills its slot.
 *
 * The band a category gets is as wide as the plot divided by the number of
 * points, and letting a bar take all of it turns a chart into a solid block.
 * Capped, the leftover becomes the gap, and the gap is what separates one bar
 * from the next, not a stroke drawn around either of them.
 */
export const BAR_MAX_WIDTH = 24

/**
 * Rounded at the reading end, square at the baseline.
 *
 * The corner radius is the control radius (`--radius-control`, 2px) doubled:
 * this is the one shape in Puddle that is not a grid cell, and a 4px cap is
 * what makes a bar read as drawn rather than as clipped. The baseline stays
 * square because it is a boundary, not an end.
 */
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0]

/** Both ends square, for a series that crosses the baseline. */
export const SQUARE_RADIUS: [number, number, number, number] = [0, 0, 0, 0]

/** Thin enough to read as a line, thick enough to follow across a gap. */
export const LINE_WIDTH = 2

/**
 * The dot under the pointer. Eight pixels across, which is the smallest mark a
 * reader can aim at, inside a ring of paper so it stays legible where the line
 * runs under it.
 */
export const DOT_RADIUS = 4
export const DOT_RING = 2

/**
 * The gap between a tick label and the plot it describes.
 *
 * Passed to both axes *and* used to reserve the y gutter (`axis-label.ts`), so
 * the two cannot disagree about how much room a tick has. The axes are also
 * given a tick size of zero: no tick lines are drawn, and a chart that reserves
 * room for a line it does not draw pushes its own labels off the edge.
 */
export const TICK_MARGIN = 6

/**
 * The size an axis tick is set in, mirroring `--text-micro`.
 *
 * A number rather than the token for the same reason as the lengths above: this
 * one reaches the SVG as an attribute, and an attribute cannot resolve a `var()`.
 */
export const TICK_FONT_SIZE = 11

/**
 * The plot's own margin, inside the panel's padding.
 *
 * Only two edges need anything. The top keeps the tallest bar's cap off the
 * panel's rule, and the right keeps the last x tick from being cut in half by
 * the edge. The other two are the axes' business, and the axes measure
 * themselves.
 */
export const PLOT_MARGIN = { top: 8, right: 12, bottom: 0, left: 0 }
