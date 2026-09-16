import { useMemo, useState } from 'react'

import { formatCount, pluralize } from '../dataset/format'
import type { QueryRun } from '../query/run-state'
import {
  axisOptions,
  NO_OVERRIDE,
  resolveAxes,
  type AxisChoice,
  type AxisOverride,
} from './chart-axes'
import { chartNotice, nullColumnNotice } from './chart-notice'
import { chartSeries, hasPlottableValue, MAX_POINTS } from './chart-series'
import { ResultChart, type ChartMode } from './ResultChart'

/**
 * The same result, one panel further down, drawn as shape.
 *
 * Two pieces of state live here and they are deliberately different in kind.
 * The **chart type** is a preference and survives every run — somebody who
 * switched to a line was telling us how they read this data, not how they read
 * this one result. The **axis choice** is a claim about columns, so it is held
 * as a column name and position and re-resolved against every new result
 * (`chart-axes.ts`): it survives editing a `WHERE` clause and is dropped the
 * moment the column it names stops existing.
 *
 * Nothing is remembered across a new file, because nothing here is: a dataset
 * replacing another clears the run, and an empty run resolves to no axes.
 */
type ChartPanelProps = {
  run: QueryRun
}

export function ChartPanel({ run }: ChartPanelProps) {
  const [mode, setMode] = useState<ChartMode>('bar')
  const [override, setOverride] = useState<AxisOverride>(NO_OVERRIDE)

  const result = run.status === 'succeeded' ? run.result : null

  const options = useMemo(
    () => (result === null ? { x: [], y: [] } : axisOptions(result.columns)),
    [result],
  )

  const axes = useMemo(
    () => (result === null ? null : resolveAxes(result.columns, override)),
    [result, override],
  )

  const series = useMemo(
    () => (result === null || axes === null ? null : chartSeries(result, axes)),
    [result, axes],
  )

  // A run-level reason there is no chart, then the one the chosen column gives.
  const notice =
    chartNotice(run) ??
    (series !== null && axes !== null && !hasPlottableValue(series.points)
      ? nullColumnNotice(axes.y.name)
      : null)

  const choose = (edge: 'x' | 'y', value: string): void => {
    setOverride((current) => ({
      ...current,
      [edge]: options[edge].find((choice) => String(choice.index) === value) ?? null,
    }))
  }

  return (
    <section className="flex h-[var(--chart-height)] shrink-0 flex-col border-t border-rule-strong bg-paper">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule px-4 py-2">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="text-micro tracking-[0.08em] text-ink-faint uppercase">Chart</span>
          {/* The chart is not virtualized and the grid above it is, so past a
              few hundred points this panel is showing less than the panel it
              summarises. Saying which rows it drew is the difference between a
              sample and a claim about the data. */}
          {series !== null && series.isTruncated ? (
            <span className="truncate font-sans text-micro text-ink-muted tabular-nums">
              first {formatCount(MAX_POINTS)} of {pluralize(series.rowCount, 'row', 'rows')}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AxisSelect
            edge="x"
            choices={options.x}
            selected={axes?.x ?? null}
            onChoose={(value) => choose('x', value)}
          />
          <AxisSelect
            edge="y"
            choices={options.y}
            selected={axes?.y ?? null}
            onChoose={(value) => choose('y', value)}
          />
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      </div>

      {notice === null && series !== null && axes !== null ? (
        <ResultChart points={series.points} mode={mode} xName={axes.x.name} yName={axes.y.name} />
      ) : null}

      {notice === null ? null : (
        /* The ruled sheet the plot would have been drawn on, showing through —
           the same surface the empty grid and the drop target use. */
        <div className="grid-rules min-h-0 flex-1 overflow-auto px-4 py-6">
          <p
            aria-live="polite"
            className={`text-lead ${run.status === 'running' ? 'text-accent' : 'text-ink-muted'}`}
          >
            {notice.headline}
          </p>
          {notice.detail === null ? null : (
            <p className="mt-1 max-w-prose font-sans text-body text-ink-muted">{notice.detail}</p>
          )}
        </div>
      )}
    </section>
  )
}

type AxisSelectProps = {
  edge: 'x' | 'y'
  choices: AxisChoice[]
  selected: AxisChoice | null
  onChoose: (value: string) => void
}

/**
 * One axis, as the columns it could be.
 *
 * Kept on screen with nothing to offer rather than hidden until a result
 * arrives: a control that appears and disappears moves everything beside it
 * twice per query, and the panel is 200px tall. Disabled says the same thing
 * without the movement — the same reason Run stays visible with its reason
 * attached rather than vanishing.
 *
 * Live means *this axis is being drawn*, which is why a result with no number
 * in it disables both selects and not just y. The x column is knowable there
 * and it is not holding anything up, and a select offering a choice that
 * changes nothing on screen is worse than one that says it has nothing to do.
 */
function AxisSelect({ edge, choices, selected, onChoose }: AxisSelectProps) {
  const isEmpty = choices.length === 0 || selected === null

  return (
    <label className="flex items-center gap-2">
      <span className="text-micro tracking-[0.08em] text-ink-faint uppercase">{edge}</span>
      <select
        value={selected === null ? '' : String(selected.index)}
        disabled={isEmpty}
        onChange={(event) => onChoose(event.target.value)}
        /* 44px on a touch layout, 32px once there is a pointer — the Run
           button's measurements, because a thumb does not care which panel a
           control is in. */
        className="h-11 max-w-40 rounded-control border border-rule bg-paper px-2 font-mono text-base text-ink disabled:cursor-not-allowed disabled:border-rule disabled:text-ink-faint md:h-8"
      >
        {isEmpty ? <option value="">—</option> : null}
        {isEmpty
          ? null
          : choices.map((choice) => (
              // The index is the value, not the name: two columns may share one.
              <option key={choice.index} value={String(choice.index)}>
                {choice.name}
              </option>
            ))}
      </select>
    </label>
  )
}

const MODES: readonly { value: ChartMode; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
]

/**
 * Bar or line, and nothing else. The v1 scope table names the two, and a third
 * would be a decision made in a component rather than in `CLAUDE.md`.
 */
function ModeToggle({ mode, onChange }: { mode: ChartMode; onChange: (mode: ChartMode) => void }) {
  return (
    <div
      role="group"
      aria-label="Chart type"
      className="flex overflow-hidden rounded-control border border-rule"
    >
      {MODES.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={mode === option.value}
          onClick={() => onChange(option.value)}
          className={`h-11 border-r border-rule px-3 font-mono text-base transition-colors duration-[var(--duration-fast)] ease-out last:border-r-0 md:h-8 ${
            mode === option.value
              ? 'bg-ink text-paper'
              : 'bg-paper text-ink-muted hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
