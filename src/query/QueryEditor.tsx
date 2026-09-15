import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorState, Prec } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

import { columnHighlighting } from './column-highlight'
import { DuckDB } from './duckdb-dialect'
import { editorHighlight, editorTheme } from './editor-theme'

/**
 * The SQL editor: one CodeMirror instance, wrapped so the rest of the app can
 * treat it as a controlled input.
 *
 * What the parent cannot express as a prop is the one thing the schema panel
 * needs — putting a column name in at the cursor — so that comes back out as an
 * imperative handle. This is the wire `EditorPlaceholder` was holding open.
 */
export type QueryEditorHandle = {
  /** Replace the selection with `text`, and leave the cursor after it. */
  insertAtCursor: (text: string) => void
  focus: () => void
}

type QueryEditorProps = {
  value: string
  /** Column names of the loaded dataset, marked wherever the query names them. */
  columnNames: readonly string[]
  /** Read-only with no dataset: there is nothing for a query to run against. */
  editable: boolean
  placeholderText: string
  onChange: (value: string) => void
  /**
   * Cmd+Enter or Ctrl+Enter. It carries the query text because the keymap reads
   * it straight off the document — a handler that closed over React state could
   * run the query as it was one render ago.
   */
  onRun: (query: string) => void
}

export const QueryEditor = forwardRef<QueryEditorHandle, QueryEditorProps>(function QueryEditor(
  { value, columnNames, editable, placeholderText, onChange, onRun },
  ref,
) {
  const host = useRef<HTMLDivElement | null>(null)
  const view = useRef<EditorView | null>(null)

  /**
   * The extensions are built once, on mount, so they must not close over this
   * render's callbacks. They read the current ones through here instead, which
   * is cheaper and less fragile than reconfiguring the editor every render.
   */
  const handlers = useRef({ onChange, onRun })
  handlers.current = { onChange, onRun }

  // Reconfigurable slices: the dataset can be replaced, and it can go away.
  const columns = useRef(new Compartment())
  const withDataset = useRef(new Compartment())

  useEffect(() => {
    const parent = host.current

    if (parent === null) {
      return
    }

    const runQuery = (target: EditorView): boolean => {
      handlers.current.onRun(target.state.doc.toString())
      return true
    }

    const instance = new EditorView({
      parent,
      state: EditorState.create({
        doc: value,
        extensions: [
          /* Highest precedence, because `Mod-Enter` is `insertBlankLine` in the
             default keymap. Ctrl is bound as well as Mod so that Ctrl+Enter
             runs the query on a Mac too, where Mod means Cmd. */
          Prec.highest(
            keymap.of([
              { key: 'Mod-Enter', preventDefault: true, run: runQuery },
              { key: 'Ctrl-Enter', preventDefault: true, run: runQuery },
            ]),
          ),

          history(),
          /* No `indentWithTab`. Trapping Tab inside the editor would take away
             the only way out of it without a pointer, and this is the widest
             control on the screen to get stuck in. */
          keymap.of([...defaultKeymap, ...historyKeymap]),

          /* The dialect's language, not `sql()`'s LanguageSupport: the second
             registers a completion source, and v1 ships no SQL autocomplete. */
          DuckDB.language,
          syntaxHighlighting(editorHighlight),
          editorTheme,

          /* A long query wraps rather than scrolling sideways. Horizontal
             scrolling inside a vertically scrolling panel is unpleasant with a
             pointer and unusable with a thumb. */
          EditorView.lineWrapping,

          EditorView.contentAttributes.of({
            'aria-label': 'SQL query',
            /* Phone keyboards capitalise sentences and autocorrect words, which
               turns `data` into `Data` and `varchar` into something else
               entirely. SQL wants none of it. */
            autocapitalize: 'off',
            autocorrect: 'off',
            autocomplete: 'off',
            spellcheck: 'false',
            /* The ruled grid, behind the text and scrolling with it. */
            class: 'grid-rules',
          }),

          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              handlers.current.onChange(update.state.doc.toString())
            }
          }),

          columns.current.of(columnHighlighting(columnNames)),
          withDataset.current.of(datasetState(editable, placeholderText)),
        ],
      }),
    })

    view.current = instance

    return () => {
      instance.destroy()
      view.current = null
    }
    // Mount once. Everything that can change afterwards is either a
    // compartment below or read through `handlers`.
  }, [])

  // The parent owns the text, so a change made anywhere else — seeding the
  // default query, say — has to be pushed in. Compared first, or every
  // keystroke would round-trip and reset the cursor.
  useEffect(() => {
    const instance = view.current

    if (instance !== null && instance.state.doc.toString() !== value) {
      instance.dispatch({
        changes: { from: 0, to: instance.state.doc.length, insert: value },
      })
    }
  }, [value])

  useEffect(() => {
    view.current?.dispatch({
      effects: columns.current.reconfigure(columnHighlighting(columnNames)),
    })
  }, [columnNames])

  // Editability and the placeholder both answer the same question — is there a
  // dataset — so they move together rather than drifting apart.
  useEffect(() => {
    view.current?.dispatch({
      effects: withDataset.current.reconfigure(datasetState(editable, placeholderText)),
    })
  }, [editable, placeholderText])

  useImperativeHandle(
    ref,
    (): QueryEditorHandle => ({
      insertAtCursor: (text: string): void => {
        const instance = view.current

        if (instance === null || !instance.state.facet(EditorView.editable)) {
          return
        }

        const { from, to } = instance.state.selection.main

        instance.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
          scrollIntoView: true,
        })

        // Focus follows the insertion, so the next thing typed lands after the
        // column name rather than back in the schema panel.
        instance.focus()
      },
      focus: (): void => view.current?.focus(),
    }),
    [],
  )

  return <div ref={host} className="h-full min-h-0 overflow-hidden" />
})

/**
 * `editable` as well as `readOnly`: read-only alone still keeps a contenteditable
 * element, so a phone would open its keyboard for an editor that cannot take a
 * character.
 */
function datasetState(editable: boolean, placeholderText: string) {
  return [
    EditorView.editable.of(editable),
    EditorState.readOnly.of(!editable),
    placeholder(placeholderText),
  ]
}
