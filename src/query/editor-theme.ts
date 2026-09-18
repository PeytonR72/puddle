/**
 * How the editor is drawn, in the vocabulary from docs/design/tokens.md.
 *
 * Two decisions worth stating, because both invert what a SQL editor usually
 * does:
 *
 * **The editor sits on the same ruled grid as everything else.** One line is
 * one `--row-height`, the content has no vertical padding, and the rules run
 * behind the text, so a line of SQL, a schema row, and (later) a result row
 * all land on the same baseline. That is the one bold move this interface
 * spends, and the editor is part of it rather than a box parked inside it.
 *
 * **Keywords recede and columns come forward.** Every SQL editor paints
 * `SELECT` blue and leaves the column names plain. In a notebook the columns
 * are the subject and the keywords are scaffolding, so the weight goes the
 * other way: structure in muted ink, and the identifiers that name a real
 * column of the loaded file in full ink at 500. No second colour is spent:
 * the accent stays reserved for the caret and for the engine working.
 */
import { HighlightStyle } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

/** The class the column marker applies. Weight only, so nothing fights it. */
export const COLUMN_MARK_CLASS = 'cm-dataset-column'

export const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    color: 'var(--color-ink)',
    backgroundColor: 'transparent',
    fontSize: 'var(--text-base)',
  },

  /* iOS zooms the page when a field under 16px takes focus, and the zoom is
     what makes an editor feel like it is fighting the keyboard: the caret
     lands off-screen and the layout has to be pinched back. 13px is the
     notebook's reading size on a pointer device; a touch device gets the size
     that stops the zoom. The row height does not change, so the grid holds. */
  '@media (pointer: coarse)': {
    /* `.cm-content`, not `&`: style-mod drops a nested `&` inside an at-rule
       and emits an empty block, which is a rule that looks right in the source
       and does nothing in the browser. */
    '.cm-content': { fontSize: 'var(--text-editor-touch)' },
  },

  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: 'var(--row-height)',
  },

  '.cm-content': {
    /* Zero, against CodeMirror's default 4px, so line one starts flush with
       the first rule. Any vertical padding here walks the text off the grid. */
    padding: '0',
    caretColor: 'var(--color-accent)',
  },

  '.cm-line': {
    padding: '0 calc(var(--spacing) * 4)',
  },

  /* A text cursor is the focus indicator for a text field, and it is already
     the accent. A ring around the editor as well would sit there for the whole
     time someone is typing, which is most of the session. */
  '&.cm-focused': {
    outline: 'none',
  },

  '.cm-content ::selection': {
    backgroundColor: 'var(--color-accent-soft)',
  },

  '.cm-placeholder': {
    color: 'var(--color-ink-faint)',
  },

  [`.${COLUMN_MARK_CLASS}`]: {
    fontWeight: '500',
  },
})

export const editorHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--color-ink-muted)' },
  { tag: tags.typeName, color: 'var(--color-ink-muted)' },
  { tag: tags.standard(tags.name), color: 'var(--color-ink-muted)' },
  {
    tag: [tags.operator, tags.punctuation, tags.paren, tags.brace, tags.squareBracket],
    color: 'var(--color-ink-faint)',
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: 'var(--color-ink-faint)',
    fontStyle: 'italic',
  },

  /* `NULL` is absence, not a value, and the token plan sets it in faint italic
     wherever it appears. The results table will draw it the same way. */
  { tag: tags.null, color: 'var(--color-ink-faint)', fontStyle: 'italic' },

  /* Literals and identifiers are the content of the query, so they keep full
     ink. `tags.special(tags.string)` is how the SQL parser tags a
     double-quoted identifier, a column name, not a string. */
  {
    tag: [tags.string, tags.special(tags.string), tags.number, tags.bool],
    color: 'var(--color-ink)',
  },
])
