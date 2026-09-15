/**
 * How a column name is written when the schema panel puts it into the editor.
 *
 * A name is inserted bare when SQL will accept it bare, and double-quoted when
 * it will not. Quoting everything would be safe and unreadable — `"id"` in
 * every query — and quoting nothing breaks on the column names real files
 * actually carry: `Total Sales`, `2024`, `order`.
 */

/** Unquoted identifiers start with a letter or underscore and stay alphanumeric. */
const BARE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/

/**
 * DuckDB's reserved keywords — the ones it refuses as an unquoted identifier.
 *
 * Deliberately only the reserved list, not every keyword DuckDB knows. `count`
 * and `value` are keywords and are perfectly legal bare, and quoting them would
 * make the common case ugly to guard a case that does not exist.
 */
const RESERVED = new Set([
  'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc', 'asymmetric',
  'both', 'case', 'cast', 'check', 'collate', 'column', 'constraint', 'create',
  'default', 'deferrable', 'desc', 'describe', 'distinct', 'do', 'else', 'end',
  'except', 'false', 'fetch', 'for', 'foreign', 'from', 'grant', 'group',
  'having', 'in', 'initially', 'intersect', 'into', 'lateral', 'leading',
  'limit', 'not', 'null', 'offset', 'on', 'only', 'or', 'order', 'pivot',
  'pivot_longer', 'pivot_wider', 'placing', 'primary', 'qualify', 'references',
  'returning', 'select', 'show', 'some', 'symmetric', 'table', 'then', 'to',
  'trailing', 'true', 'union', 'unique', 'unpivot', 'using', 'variadic', 'when',
  'where', 'window', 'with',
])

/** Quote an identifier for SQL. `"` doubles, per the SQL standard. */
function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`
}

export function needsQuoting(name: string): boolean {
  return !BARE_IDENTIFIER.test(name) || RESERVED.has(name.toLowerCase())
}

/** The text to drop into the editor for a column of this name. */
export function columnReference(name: string): string {
  return needsQuoting(name) ? quoteIdentifier(name) : name
}
