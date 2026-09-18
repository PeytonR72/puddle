/**
 * The one module that touches DuckDB (locked decision 5).
 *
 * It owns the worker, the connection, and the query API. Everything above it
 * (hooks, components, tests) talks to DuckDB through these exports and never
 * imports the bindings, which is what keeps the engine swappable and the UI
 * mockable at a single seam.
 *
 * The bindings are pulled in by dynamic `import()` inside `initialize`, not at
 * module load. Importing this file costs a few asset URLs; it does not start
 * the several-megabyte download (locked decision 1).
 */
import type {
  AsyncDuckDB,
  AsyncDuckDBConnection,
  DuckDBDataProtocol,
} from '@duckdb/duckdb-wasm'

import { localBundles } from './bundles'
import {
  classifyColumnType,
  toColumn,
  toResultValue,
  type Column,
  type Result,
  type Row,
} from './result'

export type { Column, ColumnKind, Result, ResultValue, Row } from './result'

/** Boot or registration failed: the engine is not in a state to answer queries. */
export class EngineError extends Error {
  override readonly name = 'EngineError'
}

/** A statement reached DuckDB and DuckDB refused it. `message` is DuckDB's own. */
export class QueryError extends Error {
  override readonly name = 'QueryError'

  readonly sql: string

  constructor(message: string, options: { sql: string; cause?: unknown }) {
    super(message, { cause: options.cause })
    this.sql = options.sql
  }
}

/** How far the WASM download has got. `ratio` is 0–1, for a determinate bar. */
export type EngineProgress = {
  bytesLoaded: number
  bytesTotal: number
  ratio: number
}

export type ProgressHandler = (progress: EngineProgress) => void

type Engine = {
  database: AsyncDuckDB
  connection: AsyncDuckDBConnection
  fileProtocol: DuckDBDataProtocol
  registeredFile: string | null
}

let engine: Promise<Engine> | null = null

const progressHandlers = new Set<ProgressHandler>()

/**
 * Start DuckDB, or join the start already under way.
 *
 * Idempotent: call it on every user gesture that needs the engine and it boots
 * once. A failed boot clears itself so the next call is a real retry rather
 * than a replay of the same rejection.
 */
export async function initialize(onProgress?: ProgressHandler): Promise<void> {
  if (onProgress) {
    progressHandlers.add(onProgress)
  }

  const pending = engine ?? boot()
  engine = pending

  try {
    await pending
  } catch (cause) {
    if (engine === pending) {
      engine = null
    }
    throw asEngineError(cause)
  } finally {
    if (onProgress) {
      progressHandlers.delete(onProgress)
    }
  }
}

/** Run a statement. Resolves with every row materialised; Arrow stays inside. */
export async function query(sql: string): Promise<Result> {
  const running = await requireEngine()
  const startedAt = performance.now()

  const table = await running.connection.query(sql).catch((cause: unknown) => {
    throw new QueryError(messageOf(cause), { sql, cause })
  })

  const durationMs = performance.now() - startedAt
  const columns = table.schema.fields.map(toColumn)
  // Resolve each column's vector once. Doing it per cell is a lookup per cell,
  // and a result table is the one place in this app with a lot of cells.
  const vectors = columns.map((_column, position) => table.getChildAt(position))
  const rows: Row[] = []

  for (let index = 0; index < table.numRows; index++) {
    rows.push(vectors.map((vector) => (vector ? toResultValue(vector.get(index)) : null)))
  }

  return { columns, rows, rowCount: table.numRows, durationMs }
}

/**
 * Hand DuckDB the file itself and let it read the bytes it needs, when it needs
 * them (locked decision 3). The file is never read into a string, so a 200MB
 * CSV costs nothing until a query touches it.
 *
 * Returns the name the file is registered under: that is what SQL refers to.
 */
export async function registerFile(file: File): Promise<string> {
  const running = await requireEngine()

  try {
    // One file per session, per the v1 scope table, so whatever was registered
    // before goes, rather than accumulating handles onto stale File objects.
    if (running.registeredFile !== null) {
      await running.database.dropFile(running.registeredFile)
      running.registeredFile = null
    }

    await running.database.registerFileHandle(file.name, file, running.fileProtocol, true)
    running.registeredFile = file.name
  } catch (cause) {
    throw new EngineError(`DuckDB could not open "${file.name}": ${messageOf(cause)}`, { cause })
  }

  return file.name
}

/**
 * The columns of a table, or of a registered file, which DuckDB resolves by
 * the same name. `type` is DuckDB's own spelling here, e.g. `VARCHAR`, where a
 * query result carries Arrow's, e.g. `Int64`. Compare two schemas on `name` and
 * `kind`, which mean the same thing on both sides; `type` does not.
 */
export async function describeTable(name: string): Promise<Column[]> {
  // `DESCRIBE SELECT * FROM x` rather than `DESCRIBE x`, because the second form
  // only reaches real tables and a registered file is not one.
  const described = await query(`DESCRIBE SELECT * FROM ${quoteIdentifier(name)}`)
  const nameAt = described.columns.findIndex((column) => column.name === 'column_name')
  const typeAt = described.columns.findIndex((column) => column.name === 'column_type')

  if (nameAt < 0 || typeAt < 0) {
    throw new EngineError(`DESCRIBE returned no column_name/column_type for "${name}".`)
  }

  return described.rows.map((row) => {
    const columnName = row[nameAt]
    const columnType = row[typeAt]

    if (typeof columnName !== 'string' || typeof columnType !== 'string') {
      throw new EngineError(`DESCRIBE returned a row this build does not understand for "${name}".`)
    }

    return { name: columnName, type: columnType, kind: classifyColumnType(columnType) }
  })
}

/** Close the connection and release the worker. The other half of decision 5. */
export async function terminate(): Promise<void> {
  const pending = engine

  if (!pending) {
    return
  }

  engine = null

  try {
    const running = await pending
    await running.connection.close()
    await running.database.terminate()
  } catch {
    // A boot that never finished has nothing to close; dropping the reference
    // above is the part that matters.
  }
}

/** Quote an identifier for SQL. `"` doubles, per the SQL standard. */
export function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`
}

async function boot(): Promise<Engine> {
  const bindings = await import('@duckdb/duckdb-wasm')
  const bundle = await bindings.selectBundle(localBundles)

  if (!bundle.mainWorker) {
    throw new EngineError('DuckDB chose a bundle with no worker script, which cannot happen offline.')
  }

  const worker = new Worker(bundle.mainWorker)
  const database = new bindings.AsyncDuckDB(new bindings.ConsoleLogger(bindings.LogLevel.WARNING), worker)

  try {
    await database.instantiate(bundle.mainModule, bundle.pthreadWorker, reportProgress)
    // DECIMAL arrives as a wide integer plus a scale otherwise, which no chart
    // axis and no cell formatter can do anything useful with. BIGINT is left
    // alone: an id that silently loses precision is worse than a bigint.
    await database.open({ query: { castDecimalToDouble: true } })

    const connection = await database.connect()

    return {
      database,
      connection,
      fileProtocol: bindings.DuckDBDataProtocol.BROWSER_FILEREADER,
      registeredFile: null,
    }
  } catch (cause) {
    // A half-started worker holds a thread and a chunk of WASM memory, and a
    // retry makes a new one. Release this one before the failure propagates;
    // wrapping it is asEngineError's job, in one place.
    worker.terminate()
    throw cause
  }
}

function reportProgress(progress: { bytesLoaded: number; bytesTotal: number }): void {
  const { bytesLoaded, bytesTotal } = progress
  const ratio = bytesTotal > 0 ? Math.min(bytesLoaded / bytesTotal, 1) : 0

  for (const handler of progressHandlers) {
    handler({ bytesLoaded, bytesTotal, ratio })
  }
}

async function requireEngine(): Promise<Engine> {
  const pending = engine

  if (!pending) {
    throw new EngineError('DuckDB is not running yet. Call initialize() first.')
  }

  try {
    return await pending
  } catch (cause) {
    throw asEngineError(cause)
  }
}

function asEngineError(cause: unknown): EngineError {
  return cause instanceof EngineError
    ? cause
    : new EngineError(`DuckDB failed to start: ${messageOf(cause)}`, { cause })
}

function messageOf(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message
  }

  return typeof cause === 'string' ? cause : String(cause)
}
