/**
 * Which of the three formats a dropped file is, decided by extension alone.
 *
 * Extension rather than sniffed content, because the decision has to be made
 * before DuckDB exists — the engine boots on this gesture (locked decision 1),
 * and refusing a `.docx` should not cost a stranger a several-megabyte download
 * first. A file that lies about its extension is caught later, by the reader
 * that fails on it, and gets a message from `ingest-failure.ts`.
 */

export type FileKind = 'csv' | 'tsv' | 'parquet'

/**
 * Why a file was turned away, split the same way an ingest failure is: what
 * happened, then what to do. It is not an `IngestFailure` because DuckDB never
 * saw the file — there is no engine message to carry, by construction.
 */
export type FileRefusal = {
  headline: string
  detail: string
}

export type FileAcceptance =
  | { accepted: true; kind: FileKind }
  | { accepted: false; refusal: FileRefusal }

const KIND_BY_EXTENSION: Record<string, FileKind> = {
  csv: 'csv',
  tsv: 'tsv',
  parquet: 'parquet',
}

/** The formats named in the v1 scope table, in the order the copy lists them. */
export const ACCEPTED_EXTENSIONS = ['.csv', '.tsv', '.parquet'] as const

/** For the file picker's `accept`, which wants a comma-separated list. */
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(',')

/**
 * Pick the one file a session gets, or say why a drop cannot be honoured.
 *
 * The v1 scope table allows one file per session, so a drop carrying three is a
 * real misunderstanding worth naming. Taking the first silently would load
 * something the reader did not choose and never mention the other two.
 */
export function selectSingleFile(files: readonly File[]): { file: File } | { refusal: FileRefusal } {
  const [first] = files

  if (first === undefined) {
    return {
      refusal: {
        headline: 'That drop carried no file.',
        detail: 'Some apps hand over a link rather than the file itself. Try dragging from a folder, or use the file picker.',
      },
    }
  }

  if (files.length > 1) {
    return {
      refusal: {
        headline: `Puddle reads one file at a time, and that drop had ${files.length}.`,
        detail: 'Drop a single .csv, .tsv, or .parquet file. Querying across two files is planned, not built.',
      },
    }
  }

  return { file: first }
}

/**
 * The lower-cased extension, with no dot, or `null` when the name has none.
 *
 * A leading dot does not start an extension — `.gitignore` is a name, not an
 * extension — so the search starts past the first character.
 */
export function extensionOf(fileName: string): string | null {
  const lastDot = fileName.lastIndexOf('.')

  if (lastDot < 1 || lastDot === fileName.length - 1) {
    return null
  }

  return fileName.slice(lastDot + 1).toLowerCase()
}

/**
 * Accept the file or say why not, naming the formats that would have worked.
 *
 * The refusal is written for someone who dropped the wrong thing by accident and
 * wants to be told what to drop instead, in one sentence.
 */
export function acceptFile(fileName: string): FileAcceptance {
  const extension = extensionOf(fileName)

  if (extension === null) {
    return {
      accepted: false,
      refusal: {
        headline: `"${fileName}" has no file extension.`,
        detail: 'Puddle picks the reader from the extension. Rename it to .csv, .tsv, or .parquet and drop it again.',
      },
    }
  }

  const kind = KIND_BY_EXTENSION[extension]

  if (kind === undefined) {
    return {
      accepted: false,
      refusal: {
        headline: `Puddle cannot read .${extension} files.`,
        detail: 'Drop a .csv, .tsv, or .parquet file instead.',
      },
    }
  }

  return { accepted: true, kind }
}
