/**
 * The CodeMirror half of marking the loaded dataset's columns in the query.
 *
 * All the judgement lives in `column-reference-scan.ts`, which is plain text in
 * and ranges out. This file only turns those ranges into decorations and
 * rebuilds them when the document changes.
 *
 * It is not autocomplete and does not grow into it: no completion source is
 * registered anywhere in this feature, because v1 does not ship SQL
 * autocomplete (`CLAUDE.md`). Marking a name someone already typed is the part
 * that pays for itself — it is how a typo in a column name becomes visible
 * before the query runs.
 */
import { RangeSetBuilder, type Extension } from '@codemirror/state'
import { Decoration, ViewPlugin, type DecorationSet, type EditorView, type ViewUpdate } from '@codemirror/view'

import { columnNameKeys, findColumnReferences } from './column-reference-scan'
import { COLUMN_MARK_CLASS } from './editor-theme'

const columnMark = Decoration.mark({ class: COLUMN_MARK_CLASS })

function markColumns(view: EditorView, columnNames: ReadonlySet<string>): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()

  // The whole document, not the visible lines: see column-reference-scan.ts.
  for (const { from, to } of findColumnReferences(view.state.doc.toString(), columnNames)) {
    builder.add(from, to, columnMark)
  }

  return builder.finish()
}

/** An extension that marks the given column names wherever the query names them. */
export function columnHighlighting(columnNames: readonly string[]): Extension {
  const keys = columnNameKeys(columnNames)

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        this.decorations = markColumns(view, keys)
      }

      update(update: ViewUpdate): void {
        if (update.docChanged) {
          this.decorations = markColumns(update.view, keys)
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  )
}
