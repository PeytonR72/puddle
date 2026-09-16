import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { groupDigits } from '../results/cell-format'
import { truncateLabel, yAxisLabels } from './axis-label'
import { niceScale } from './axis-scale'
import type { ChartPoint } from './chart-series'
import {
  BAR_MAX_WIDTH,
  BAR_RADIUS,
  DOT_RADIUS,
  DOT_RING,
  LINE_WIDTH,
  PLOT_MARGIN,
  SQUARE_RADIUS,
  TICK_FONT_SIZE,
  TICK_MARGIN,
} from './marks'

export type ChartMode = 'bar' | 'line'

/**
 * The result, drawn as shape.
 *
 * One series, in the grid's own ink (`docs/design/tokens.md`), because this is
 * the same data as the rows above and not a second subject. That decision pays
 * for itself in what it leaves free: the accent still means *focus*, so the mark
 * under the pointer is the only coloured thing on the plot.
 *
 * Every colour is passed as a prop, as `var(--color-…)`. SVG resolves a custom
 * property in a presentation attribute perfectly well — that was measured in
 * Chromium rather than assumed — and passing it beats the alternative of a
 * class on the wrapper, because Recharts gives each mark its own `fill` or
 * `stroke` prop by default (a `Line` is `#3182bd` unless told otherwise) and an
 * attribute on the element wins over a colour inherited from its parent.
 *
 * Nothing animates. A chart that grows its bars on every run charges the reader
 * for a transition they did not ask for, twice a minute.
 */
type ResultChartProps = {
  points: ChartPoint[]
  mode: ChartMode
  /** The column names, which the tooltip uses in place of a legend. */
  xName: string
  yName: string
}

const VALUE_KEY = 'value'

export function ResultChart({ points, mode, xName, yName }: ResultChartProps) {
  // A bar is a length and a line is a position, so only one of them owes the
  // reader a zero (`axis-scale.ts`).
  const scale = niceScale(points, { includeZero: mode === 'bar' })
  const yLabels = yAxisLabels(scale?.ticks ?? [])

  // A radius marks the end a bar is read from. Once a series crosses the
  // baseline that end is the top of some bars and the bottom of others, and one
  // radius cannot be both — so it marks neither rather than the wrong one.
  const crossesZero = scale !== null && scale.domain[0] < 0

  const xAxis = (
    <XAxis
      dataKey="label"
      tickFormatter={(value: unknown) => truncateLabel(String(value))}
      tickLine={false}
      tickSize={0}
      tickMargin={TICK_MARGIN}
      minTickGap={8}
      tick={{ fill: 'var(--color-ink-muted)', fontSize: TICK_FONT_SIZE }}
      axisLine={{ stroke: 'var(--color-rule-strong)' }}
    />
  )

  const yAxis = (
    <YAxis
      tickFormatter={(value: unknown) => (typeof value === 'number' ? yLabels.format(value) : '')}
      tickLine={false}
      tickSize={0}
      tickMargin={TICK_MARGIN}
      axisLine={false}
      /* The ticks are chosen here rather than by the chart, which would divide
         the exact extent of the data into equal parts and label them 950,
         1,900, 2,850. */
      {...(scale === null ? {} : { domain: scale.domain, ticks: scale.ticks })}
      width={yLabels.width}
      tick={{ fill: 'var(--color-ink-muted)', fontSize: TICK_FONT_SIZE }}
    />
  )

  /* Horizontal only, and solid. A vertical grid would re-draw the category
     boundaries the bars already stand on, and a dashed rule reads as a
     projection or a threshold when it is neither. */
  const grid = <CartesianGrid vertical={false} stroke="var(--color-rule)" />

  return (
    /* ResponsiveContainer measures its parent, and a flex child that measures
       its parent can only grow. Taking it out of flow against a positioned box
       is what stops the plot from pushing the panel open a frame at a time. */
    <div className="relative min-h-0 flex-1">
      <div className="absolute inset-0 p-3">
        <ResponsiveContainer width="100%" height="100%">
          {mode === 'bar' ? (
            <BarChart data={points} margin={PLOT_MARGIN} accessibilityLayer>
              {grid}
              {xAxis}
              {yAxis}
              {/* A wash the width of the whole band, so the pointer does not
                  have to find a 6px bar to read its value. */}
              <Tooltip
                content={<ChartTooltip xName={xName} yName={yName} />}
                cursor={{ fill: 'var(--color-accent-soft)' }}
              />
              <Bar
                dataKey={VALUE_KEY}
                fill="var(--color-mark)"
                maxBarSize={BAR_MAX_WIDTH}
                radius={crossesZero ? SQUARE_RADIUS : BAR_RADIUS}
                activeBar={{ fill: 'var(--color-mark-active)' }}
                isAnimationActive={false}
              />
            </BarChart>
          ) : (
            <LineChart data={points} margin={PLOT_MARGIN} accessibilityLayer>
              {grid}
              {xAxis}
              {yAxis}
              {/* The crosshair: a reader aims at a category, never at a 2px line. */}
              <Tooltip
                content={<ChartTooltip xName={xName} yName={yName} />}
                cursor={{ stroke: 'var(--color-rule-strong)' }}
              />
              <Line
                dataKey={VALUE_KEY}
                stroke="var(--color-mark)"
                strokeWidth={LINE_WIDTH}
                strokeLinecap="round"
                strokeLinejoin="round"
                /* No dot per point — at 500 points that is 500 marks nobody
                   reads. The one under the pointer is drawn instead. */
                dot={false}
                activeDot={{
                  r: DOT_RADIUS,
                  strokeWidth: DOT_RING,
                  fill: 'var(--color-mark-active)',
                  stroke: 'var(--color-paper)',
                }}
                /* A NULL is a hole, and a line drawn across it claims a reading
                   that was never taken. */
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/**
 * One point, read out.
 *
 * The value leads and the column name follows, which is the legend's hierarchy
 * inverted on purpose: by the time somebody is hovering a bar they know what
 * they are looking at and want the number. Nothing here gates a value — the row
 * it came from is in the grid directly above, in full precision.
 */
type ChartTooltipProps = {
  xName: string
  yName: string
  active?: boolean
  payload?: readonly { payload?: unknown }[]
}

function ChartTooltip({ xName, yName, active, payload }: ChartTooltipProps) {
  const point = active === true ? toChartPoint(payload?.[0]?.payload) : null

  if (point === null) {
    return null
  }

  return (
    <div className="border border-rule-strong bg-paper px-3 py-2">
      <p className="text-base text-ink tabular-nums">
        {point.value === null ? (
          <span className="text-null italic">NULL</span>
        ) : (
          /* The row's own digits, grouped — not the axis's rounding. The cell
             for this value is a few inches up, and the two saying different
             numbers is worse than either of them being long. */
          groupDigits(String(point.value))
        )}
      </p>
      <p className="mt-0.5 text-micro text-ink-muted">{yName}</p>
      <p className="mt-2 max-w-48 truncate text-base text-ink">{point.label}</p>
      <p className="mt-0.5 text-micro text-ink-muted">{xName}</p>
    </div>
  )
}

/**
 * Recharts hands the original datum back as `unknown`, so it is narrowed here
 * rather than trusted. It is a `ChartPoint` that went in and a `ChartPoint` that
 * should come out, but the type system stops at the library boundary.
 */
function toChartPoint(value: unknown): ChartPoint | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  if (!('label' in value) || !('value' in value)) {
    return null
  }

  const { label, value: height } = value

  if (typeof label !== 'string') {
    return null
  }

  if (height !== null && typeof height !== 'number') {
    return null
  }

  return { label, value: height }
}
