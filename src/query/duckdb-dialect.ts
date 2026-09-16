/**
 * DuckDB, described to CodeMirror's SQL parser.
 *
 * `@codemirror/lang-sql` ships Postgres, MySQL, SQLite and friends, but no
 * DuckDB, and the differences are ones a reader would notice: `#` is not a
 * comment, `::` is the cast operator, double quotes are identifiers rather than
 * strings, and the syntax people actually come to DuckDB for — `QUALIFY`,
 * `PIVOT`, `EXCLUDE`, `USING SAMPLE` — is not in any of the bundled lists.
 *
 * Only the language is exported, not `sql()`'s full `LanguageSupport`. That is
 * the difference between highlighting and autocomplete: the dialect's keywords
 * colour the query, and no completion source is registered, because v1 does not
 * ship SQL autocomplete (`CLAUDE.md`).
 */
import { SQLDialect } from '@codemirror/lang-sql'

/**
 * Written lower-case and space-separated, which is the format the dialect takes.
 * The parser matches them case-insensitively, so `SELECT` highlights too.
 */
const KEYWORDS = [
  'all alter analyze and any anti as asc asof at attach begin between by call cascade case cast',
  'check checkpoint collate column columns comment commit copy create cross cube current',
  'database default delete desc describe detach distinct do drop else end escape except exclude',
  'execute exists explain export extract false fetch filter first following for force foreign from',
  'full glob grant group grouping groups having if ilike import in index inner insert install',
  'intersect interval into is join lateral left like limit load macro map materialized natural',
  'not notnull null nulls offset on only or order others over partition pivot pragma preceding',
  'prepare primary qualify range recursive references rename replace respect returning right',
  'rollback rollup row rows sample select semi set show similar some summarize table tablesample',
  'then to transaction true try_cast unbounded union unique unpivot update using vacuum values',
  'view when where window with within',
].join(' ')

/**
 * The types worth knowing by name. DuckDB's aliases are here too — a reader who
 * writes `INT8` rather than `BIGINT` is writing the same type and should see it
 * treated the same way.
 */
const TYPES = [
  'bigint bit blob bool boolean bpchar bytea char date datetime dec decimal double enum float',
  'float4 float8 hugeint int int1 int2 int4 int8 integer interval json list logical long map',
  'numeric real short signed smallint string struct text time timestamp timestamptz timestamp_ms',
  'timestamp_ns timestamp_s tinyint ubigint uhugeint uinteger union usmallint utinyint uuid',
  'varbinary varchar',
].join(' ')

/**
 * The functions a first query reaches for. Not DuckDB's full catalogue — that
 * is thousands of names and would mark most of a query as built-in, which tells
 * a reader nothing.
 */
const BUILTIN = [
  'abs avg cast ceil coalesce concat count cume_dist date_diff date_part date_trunc dense_rank',
  'epoch first_value greatest ifnull lag last_value lead least len length list_value lower ltrim',
  'max median min mode nth_value ntile nullif percent_rank quantile rank regexp_matches',
  'regexp_replace round row_number rtrim stddev strftime string_agg strptime substr sum trim',
  'trunc try_cast upper var_samp',
].join(' ')

export const DuckDB: SQLDialect = SQLDialect.define({
  keywords: KEYWORDS,
  types: TYPES,
  builtin: BUILTIN,

  // DuckDB follows the SQL standard here: a backslash in a string is a
  // backslash, and `'C:\path\'` ends where it looks like it ends.
  backslashEscapes: false,

  // `--` and `/* */` only. `#` starts nothing, and `//` is integer division,
  // so reading either as a comment would grey out the rest of a working line.
  hashComments: false,
  slashComments: false,

  // Double quotes make an identifier, never a string, and DuckDB compares
  // identifiers case-insensitively however they are written.
  identifierQuotes: '"',
  caseInsensitiveIdentifiers: true,

  doubleDollarQuotedStrings: true,

  // The default set plus `:`, so the `::` in `amount::DOUBLE` reads as the one
  // operator it is rather than as punctuation around a type name.
  operatorChars: '*+-%<>!=&|~^/:',
})
