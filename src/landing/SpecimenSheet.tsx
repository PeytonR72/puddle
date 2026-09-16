import { useCallback, useRef, useState } from 'react'

import { FileButton } from '../dataset/FileButton'
import { plotSpecimen, weekAt, weekStartDate } from './specimen-geometry'
import { SPECIMEN_ROW_COUNT, SPECIMEN_SERIES } from './specimen-series'

/**
 * The first screen: the bundled dataset mounted as a herbarium specimen sheet.
 *
 * Four categories are pressed as weekly-mean traces and the determination label
 * states what was examined and what was transmitted — which is the honest form
 * for a product whose whole claim is that the engine is in the page. The label
 * is live: moving along a specimen rewrites it to that week's reading, so the
 * sheet is instrumentation a stranger can operate before they have committed to
 * anything, rather than a picture of a tool.
 *
 * Nothing here boots DuckDB. The traces come from specimen-series.ts, computed
 * at build time from the same file, because locked decision 1 keeps the engine
 * out of the page until a stranger asks for it.
 */
const FIRST_DATE = '2024-01-01'
const WEEK_COUNT = SPECIMEN_SERIES[0]?.weeks.length ?? 0

type Reading = {
  readonly week: number
  readonly category: string
}

type SpecimenSheetProps = {
  onTryDemo: () => void
  onFiles: (files: readonly File[]) => void
}

export function SpecimenSheet({ onTryDemo, onFiles }: SpecimenSheetProps) {
  const [reading, setReading] = useState<Reading | null>(null)

  return (
    <div className="flex flex-1 flex-col">
      <header>
        <h1 className="font-display text-hero leading-none font-bold tracking-[-0.03em] text-ink">
          puddle
        </h1>
        <p className="mt-2 font-sans text-small tracking-[0.18em] text-specimen-faint uppercase">
          Specimen sheet · examined in this tab
        </p>
      </header>

      <div className="mt-5 h-px w-full bg-ink" />

      {/* The determination and its stamp lead on a narrow screen and sit beside
          the specimens on a wide one. The sheet's own reading order is
          data-first, but a phone that buries the one button under four traces
          fails the bar the whole product is measured against. */}
      <div className="mt-5 flex flex-1 flex-col gap-7 lg:flex-row lg:gap-10">
        <section className="flex min-w-0 flex-1 flex-col lg:order-1">
          <p className="font-sans text-micro tracking-[0.18em] text-specimen-faint uppercase">
            Weekly mean revenue by category
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:gap-3">
          {SPECIMEN_SERIES.map((specimen, index) => (
            <SpecimenTrace
              key={specimen.category}
              specimen={specimen}
              order={index}
              activeWeek={reading?.category === specimen.category ? reading.week : null}
              onRead={setReading}
              onLeave={() => setReading(null)}
            />
          ))}
        </div>

          <MountedFragment />
        </section>

        <aside className="order-first flex w-full shrink-0 flex-col gap-5 lg:order-last lg:w-[19rem]">
          <Determination reading={reading} />

          <div className="flex flex-col items-start gap-3">
            <AccessionStamp onClick={onTryDemo} />
            <p className="font-sans text-micro leading-[1.5] text-ink-muted">
              Or drop a CSV or TSV anywhere on this page to examine your own.
            </p>
            <FileButton onFiles={onFiles} variant="quiet">
              Choose a file
            </FileButton>
          </div>
        </aside>
      </div>

      {/* A sheet is signed at its foot. Without this the generous bottom margin
          reads as a page that ran out of content rather than as the margin a
          mounted specimen is given. */}
      <footer className="mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-sans text-micro tracking-[0.16em] text-specimen-faint uppercase">
        <span>Acc. 0001 · one file per session</span>
        <span>No account · no key</span>
      </footer>
    </div>
  )
}

function SpecimenTrace({
  specimen,
  order,
  activeWeek,
  onRead,
  onLeave,
}: {
  specimen: (typeof SPECIMEN_SERIES)[number]
  order: number
  activeWeek: number | null
  onRead: (reading: Reading) => void
  onLeave: () => void
}) {
  const plot = plotSpecimen(specimen)
  const fieldRef = useRef<HTMLDivElement>(null)

  const read = useCallback(
    (clientX: number) => {
      const field = fieldRef.current
      if (!field) return
      const box = field.getBoundingClientRect()
      if (box.width === 0) return
      onRead({ week: weekAt(WEEK_COUNT, (clientX - box.left) / box.width), category: specimen.category })
    },
    [onRead, specimen.category],
  )

  const d = plot.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(p.x * 100).toFixed(2)},${(100 - p.y * 100).toFixed(2)}`)
    .join('')

  const active = activeWeek === null ? null : plot.points[activeWeek]

  return (
    // Beside the trace once there is width for it; above and below it on a
    // phone, where 80px of label either side would leave the specimen a third
    // of the sheet and turn a measurable trace into texture.
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-end sm:gap-3">
      <div className="flex items-baseline justify-between gap-3 sm:contents">
        <span className="font-sans text-micro tracking-[0.14em] text-specimen-faint uppercase sm:w-20 sm:shrink-0 sm:pb-1 sm:text-right">
          {specimen.category}
        </span>
        <span className="font-mono text-micro text-specimen-faint sm:hidden">
          {plot.low.toFixed(0)}–{plot.high.toFixed(0)} · mean{' '}
          <span className="text-base text-specimen">{plot.mean.toFixed(0)}</span>
        </span>
      </div>

      <div
        ref={fieldRef}
        className="relative min-w-0 flex-1"
        onPointerMove={(event) => read(event.clientX)}
        onPointerLeave={onLeave}
      >
        {/* The viewBox reaches above the drawn range so a peak stops short of
            the specimen above it: adjacent traces crossing each other's
            baselines reads as one tangled plant, not four mounted ones. */}
        <svg
          viewBox="0 -14 100 114"
          preserveAspectRatio="none"
          className="block h-[4.25rem] w-full"
          role="img"
          aria-label={`${specimen.category}: weekly mean revenue from ${plot.low.toFixed(0)} to ${plot.high.toFixed(0)} dollars, mean ${plot.mean.toFixed(0)}`}
        >
          <path
            d={d}
            fill="none"
            stroke="var(--color-specimen)"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
            className="specimen-draw"
            style={{ animationDelay: `${order * 140}ms` }}
          />
          {active ? (
            <line
              x1={active.x * 100}
              y1="0"
              x2={active.x * 100}
              y2="100"
              stroke="var(--color-stamp)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        <div className="h-px w-full bg-rule" />
      </div>

      <span className="hidden w-16 shrink-0 pb-1 text-right font-mono text-micro leading-[1.3] text-specimen-faint sm:block">
        {plot.low.toFixed(0)}–{plot.high.toFixed(0)}
        <span className="block text-base text-specimen">{plot.mean.toFixed(0)}</span>
      </span>
    </div>
  )
}

/**
 * The determination. Before the pointer touches a specimen it describes the
 * sheet; under the pointer it describes one week. Both are readings of the same
 * material, which is why it is one block that changes rather than a block and a
 * tooltip.
 */
function Determination({ reading }: { reading: Reading | null }) {
  const specimen = reading ? SPECIMEN_SERIES.find((s) => s.category === reading.category) : undefined
  const value = specimen?.weeks[reading?.week ?? 0]

  return (
    <dl className="border border-ink bg-sheet-inset px-4 py-3" aria-live="polite">
      <dt className="sr-only">Determination</dt>
      <dd className="mb-3 border-b border-ink pb-2 font-sans text-micro tracking-[0.2em] text-ink uppercase">
        Determination
      </dd>

      {reading && specimen && value !== undefined ? (
        <div className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 font-mono text-micro">
          <Field label="Week of" value={weekStartDate(FIRST_DATE, reading.week)} />
          <Field label="Category" value={specimen.category} />
          <Field label="Mean" value={`$${value.toFixed(2)}`} />
          <Field label="Reading" value={`${reading.week + 1} of ${WEEK_COUNT}`} />
        </div>
      ) : (
        <div className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1.5 font-mono text-micro">
          <Field label="Dataset" value="coffee-shop-sales.csv" />
          <Field label="Rows" value={SPECIMEN_ROW_COUNT.toLocaleString('en-US')} />
          <Field label="Columns" value="date, category, revenue" />
          <Field label="Engine" value="DuckDB-WASM, in page" />
          <Field label="Transmitted" value="nothing" />
        </div>
      )}
    </dl>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="font-sans tracking-[0.06em] text-specimen-faint uppercase">{label}</span>
      <span className="break-words text-ink">{value}</span>
    </>
  )
}

/**
 * The accession stamp: the mark a collection puts on a sheet when it takes it
 * in. It is the primary action, and the only saturated thing on the page.
 */
function AccessionStamp({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group -rotate-[4deg] border-2 border-stamp bg-sheet px-6 py-3 text-left transition-[transform,background-color] duration-[var(--duration-fast)] ease-out hover:rotate-0 hover:bg-stamp-soft focus-visible:rotate-0"
    >
      <span className="block font-display text-lead leading-none font-bold tracking-[0.14em] text-stamp uppercase">
        Examine
      </span>
      <span className="mt-1 block font-sans text-micro tracking-[0.1em] text-stamp uppercase">
        Runs here · no upload
      </span>
    </button>
  )
}

function MountedFragment() {
  return (
    <div className="mt-7">
      <p className="font-sans text-micro tracking-[0.18em] text-specimen-faint uppercase">
        Mounted fragment · first rows
      </p>
      <pre className="mt-2 overflow-x-auto border-l-2 border-specimen pl-4 font-mono text-micro leading-[1.7] text-specimen">
        {'2024-01-01  Coffee     186.06\n2024-01-01  Tea         71.03\n2024-01-01  Pastry      97.68\n2024-01-01  Sandwich   121.00'}
      </pre>
    </div>
  )
}
