/**
 * Turning a failed load into something worth reading.
 *
 * DuckDB's own text is accurate and long — the CSV sniffer alone answers with
 * twenty lines of candidate delimiters and a caret pointing at SQL the user
 * never wrote. So every failure gets a sentence saying what happened and a
 * sentence saying what to try, and DuckDB's words are kept beside them rather
 * than thrown away or shown first.
 *
 * The signatures matched below were read off the engine in a browser, not
 * recalled: see docs/adr/0001-parquet-needs-an-extension.md for the Parquet
 * ones, which are the surprising half.
 */
import type { FileKind } from './file-kind'

export type IngestFailure = {
  /** One sentence: what happened. */
  headline: string
  /** One or two sentences: what to do about it. */
  detail: string
  /** DuckDB's own text, for the disclosure. `null` when DuckDB never spoke. */
  engineMessage: string | null
}

/**
 * An empty file is checked before the engine boots, because DuckDB does not
 * treat it as an error: `read_csv_auto` on zero bytes returns a single VARCHAR
 * column called `column0` and no rows, which looks like a successful load of a
 * strange file rather than the mistake it is.
 */
export function emptyFileFailure(fileName: string): IngestFailure {
  return {
    headline: `"${fileName}" is empty.`,
    detail: 'The file has no bytes in it. Check that it finished downloading or exporting, then drop it again.',
    engineMessage: null,
  }
}

export function engineStartFailure(engineMessage: string): IngestFailure {
  return {
    headline: 'DuckDB did not start.',
    detail:
      'Puddle runs the engine as WebAssembly in this tab. Reload the page and try again; if it keeps failing, something in the browser is blocking WebAssembly or the worker.',
    engineMessage,
  }
}

/**
 * The Parquet reader ships as a separate DuckDB extension that this build does
 * not carry, so every `read_parquet` call fails before it reaches the file.
 * The failure surfaces as a raw WebAssembly trap or as a blocked request for
 * the extension, neither of which says "Parquet".
 */
function looksLikeMissingParquetExtension(message: string): boolean {
  const lowered = message.toLowerCase()

  return (
    lowered.includes('duckdb_extension.wasm') ||
    lowered.includes('extension "parquet"') ||
    lowered.includes('table index is out of bounds') ||
    lowered.includes('memory access out of bounds') ||
    lowered.includes('null function or function signature mismatch')
  )
}

/** The sniffer gave up: it could not find a dialect that fits every row. */
function looksLikeDialectFailure(message: string): boolean {
  const lowered = message.toLowerCase()

  return (
    lowered.includes('sniffing file') ||
    lowered.includes('automatically detect the csv parsing dialect')
  )
}

/** The dialect was fine; a value in it would not become the column's type. */
function looksLikeConversionFailure(message: string): boolean {
  const lowered = message.toLowerCase()

  return (
    lowered.includes('csv error on line') ||
    lowered.includes('could not convert string') ||
    lowered.includes('error when converting column')
  )
}

export function messageOf(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message
  }

  return typeof cause === 'string' ? cause : String(cause)
}

/**
 * Classify a failure that happened while reading the file.
 *
 * `kind` carries most of the weight: a WebAssembly trap means one thing when we
 * asked for Parquet and something else entirely otherwise, and the raw message
 * cannot tell the two apart on its own.
 */
export function classifyIngestFailure(
  cause: unknown,
  context: { fileName: string; kind: FileKind },
): IngestFailure {
  const engineMessage = messageOf(cause)
  const { fileName, kind } = context

  if (kind === 'parquet') {
    if (looksLikeMissingParquetExtension(engineMessage)) {
      return {
        headline: 'This build of Puddle cannot read Parquet.',
        detail:
          'DuckDB-WASM keeps its Parquet reader in a separate extension, and the bundle Puddle ships does not include it. CSV and TSV files work today.',
        engineMessage,
      }
    }

    return {
      headline: `DuckDB could not read "${fileName}" as Parquet.`,
      detail:
        'A Parquet file ends with a footer describing its columns, and DuckDB did not find a readable one. Check that the file finished writing, or export it again.',
      engineMessage,
    }
  }

  if (looksLikeDialectFailure(engineMessage)) {
    return {
      headline: `Puddle could not work out how "${fileName}" is laid out.`,
      detail:
        kind === 'tsv'
          ? 'Puddle read it as tab-separated, because the name ends in .tsv. If it uses another separator, rename it to .csv and drop it again.'
          : 'DuckDB tried comma, tab, semicolon and pipe, and no separator gave every row the same number of columns. Open the file as text and check the first few lines.',
      engineMessage,
    }
  }

  if (looksLikeConversionFailure(engineMessage)) {
    return {
      headline: `A value in "${fileName}" did not fit the column it is in.`,
      detail:
        'DuckDB reads the first rows to pick each column type, then holds the rest to it. The line DuckDB names below is the one that broke the pattern.',
      engineMessage,
    }
  }

  return {
    headline: `DuckDB could not read "${fileName}".`,
    detail: 'Puddle does not have a better explanation than DuckDB does here. Its message follows.',
    engineMessage,
  }
}
