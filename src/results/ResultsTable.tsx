import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useMemo, useRef } from 'react'

import type { Column, ColumnKind, Result, ResultValue } from '../duckdb/client'
import { columnAlign, formatCell, type CellAlign } from './cell-format'
import { fitsColumn, MIN_COLUMN_WIDTH, resultColumnWidths } from './column-width'
import { HEAD_HEIGHT, ROW_HEIGHT } from './metrics'
import { sqlTypeName } from './type-name'

/**
 * The result, as the ruled grid the whole interface is built out of.
 *
 * Virtualized on both axes against one scroll container. Rows are the reason —
 * a hundred thousand of them is a normal answer to a normal query, and a
 * hundred thousand DOM rows is a locked tab — but columns get the same treatment
 * because `SELECT *` on a wide CSV is just as easy to type.
 *
 * Every cell is placed by arithmetic rather than by layout: the browser is never
 * asked to measure anything, which is what keeps a scroll frame cheap. The cost
 * is that column widths are estimated up front (`column-width.ts`), and the
 * cells that outgrow their column say so — they truncate, and offer the whole
 * value on hover or on a tap.
 */
export type CellAddress = {
  row: number
  column: number
}

type ResultsTableProps = {
  result: Result
  /** The cell whose full value is being shown, if any. */
  selected: CellAddress | null
  onSelect: (address: CellAddress) => void
}

export function ResultsTable({ result, selected, onSelect }: ResultsTableProps) {
  const scroller = useRef<HTMLDivElement | null>(null)
  const { columns, rows } = result

  const widths = useMemo(() => resultColumnWidths(columns, rows), [columns, rows])
  const alignments = useMemo(() => columns.map((column) => columnAlign(column.kind)), [columns])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scroller.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    // The rows start below the header, not at the top of the scroll container.
    // Without this the virtualizer computes the visible range a header's worth
    // of pixels too high, and leaves a gap at the bottom edge while scrolling.
    scrollMargin: HEAD_HEIGHT,
  })

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => scroller.current,
    estimateSize: (index) => widths[index] ?? MIN_COLUMN_WIDTH,
    overscan: 3,
  })

  // A new result is a new set of widths, and the horizontal virtualizer holds
  // the old ones until it is told otherwise.
  useEffect(() => {
    columnVirtualizer.measure()
  }, [columnVirtualizer, widths])

  // A new result starts at its first row. Landing halfway down a different
  // result set is disorienting, and the row you are looking at is not the row
  // you were looking at.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0, left: 0 })
  }, [result])

  const virtualRows = rowVirtualizer.getVirtualItems()
  const virtualColumns = columnVirtualizer.getVirtualItems()
  const totalWidth = columnVirtualizer.getTotalSize()

  return (
    <div
      ref={scroller}
      role="table"
      /* The header is a row, and it is the first one. */
      aria-rowcount={rows.length + 1}
      aria-colcount={columns.length}
      /* Focusable so the grid can be scrolled from the keyboard without a
         pointer. `overscroll-x-contain` stops a horizontal flick at the end of
         the columns rather than handing it to the page, which on iOS is what
         turns "look at the last column" into a back-navigation. */
      tabIndex={0}
      className="min-h-0 flex-1 overflow-auto overscroll-x-contain"
    >
      {/* Wider than the viewport when the columns are; never narrower, so the
          rules carry to the right edge instead of stopping mid-screen. Every
          row is a child of this one element — the header included — so the
          grid reads as a table rather than as rows inside anonymous divs. */}
      <div
        role="rowgroup"
        className="relative"
        style={{ minWidth: totalWidth, height: HEAD_HEIGHT + rowVirtualizer.getTotalSize() }}
      >
        <div
          role="row"
          aria-rowindex={1}
          className="sticky top-0 z-10 h-[var(--head-height)] border-b border-rule-strong bg-surface"
        >
          {virtualColumns.map((virtualColumn) => {
            const column = columns[virtualColumn.index]

            if (column === undefined) {
              return null
            }

            return (
              <HeadCell
                key={virtualColumn.key}
                column={column}
                position={virtualColumn.index}
                align={alignments[virtualColumn.index] ?? 'left'}
                left={virtualColumn.start}
                width={virtualColumn.size}
              />
            )
          })}
        </div>

        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index]

          if (row === undefined) {
            return null
          }

          return (
            <div
              key={virtualRow.key}
              role="row"
              aria-rowindex={virtualRow.index + 2}
              /* `start` is measured from the top of the scroll container, header
                 included, which is what `scrollMargin` above buys. Hover is not
                 animated: at this density an instant response reads as a more
                 responsive table (docs/design/tokens.md). */
              className="absolute inset-x-0 top-0 border-b border-rule hover:bg-surface"
              style={{ height: ROW_HEIGHT, transform: `translateY(${virtualRow.start}px)` }}
            >
              {virtualColumns.map((virtualColumn) => {
                const column = columns[virtualColumn.index]

                if (column === undefined) {
                  return null
                }

                return (
                  <BodyCell
                    key={virtualColumn.key}
                    value={row[virtualColumn.index] ?? null}
                    kind={column.kind}
                    align={alignments[virtualColumn.index] ?? 'left'}
                    position={virtualColumn.index}
                    left={virtualColumn.start}
                    width={virtualColumn.size}
                    isSelected={
                      selected !== null &&
                      selected.row === virtualRow.index &&
                      selected.column === virtualColumn.index
                    }
                    onSelect={() =>
                      onSelect({ row: virtualRow.index, column: virtualColumn.index })
                    }
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

type HeadCellProps = {
  column: Column
  position: number
  align: CellAlign
  left: number
  width: number
}

/**
 * A column name over its type.
 *
 * The type is shown rather than hidden behind a tooltip, because `BIGINT` beside
 * `order_id` is the vocabulary the next query gets checked against — it is
 * content, not chrome (docs/design/tokens.md).
 */
function HeadCell({ column, position, align, left, width }: HeadCellProps) {
  const type = sqlTypeName(column.type)

  return (
    <div
      role="columnheader"
      aria-colindex={position + 1}
      title={`${column.name} — ${type}`}
      className={`absolute top-0 flex h-full flex-col justify-center gap-0.5 border-r border-rule px-3 ${
        align === 'right' ? 'items-end' : 'items-start'
      }`}
      style={{ left, width }}
    >
      <span className="max-w-full truncate text-base font-medium text-ink">{column.name}</span>
      <span className="max-w-full truncate text-micro text-ink-faint">{type}</span>
    </div>
  )
}

type BodyCellProps = {
  value: ResultValue
  kind: ColumnKind
  align: CellAlign
  position: number
  left: number
  width: number
  isSelected: boolean
  onSelect: () => void
}

function BodyCell({
  value,
  kind,
  align,
  position,
  left,
  width,
  isSelected,
  onSelect,
}: BodyCellProps) {
  const cell = formatCell(value, kind)
  const isClipped = !cell.isNull && !fitsColumn(cell.text, width)

  return (
    <div
      role="cell"
      aria-colindex={position + 1}
      className={`absolute top-0 flex h-full items-center px-3 tabular-nums ${
        align === 'right' ? 'justify-end' : 'justify-start'
      } ${isSelected ? 'bg-accent-soft' : ''}`}
      style={{ left, width }}
    >
      {cell.isNull ? <span className="text-null italic">{cell.text}</span> : null}

      {/* Only a clipped cell is interactive, because only a clipped cell is
          hiding anything. `title` covers a pointer; the click opens the strip
          below the grid, which is the half of it that works on a thumb. */}
      {!cell.isNull && isClipped ? (
        <button
          type="button"
          onClick={onSelect}
          title={cell.text}
          className={`min-w-0 truncate ${align === 'right' ? 'text-right' : 'text-left'}`}
        >
          {cell.text}
        </button>
      ) : null}

      {!cell.isNull && !isClipped ? (
        <span className="min-w-0 truncate">{cell.text}</span>
      ) : null}
    </div>
  )
}
