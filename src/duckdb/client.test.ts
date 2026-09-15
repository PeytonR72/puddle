import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  describeTable,
  EngineError,
  initialize,
  query,
  QueryError,
  quoteIdentifier,
  registerFile,
  terminate,
} from './client'

/**
 * These tests stand in for the bindings at the dynamic-import seam, which is the
 * only place client.ts reaches DuckDB. That is the seam locked decision 5 exists
 * to create, so exercising it here is also a check that it held.
 */

type FakeColumn = { name: string; type: string; values: unknown[] }

type ProgressStep = { bytesLoaded: number; bytesTotal: number }

type Registration = {
  name: string
  handle: unknown
  protocol: number
  directIO: boolean
}

type HarnessState = {
  bootFailure: Error | null
  queryFailure: Error | null
  registerFailure: Error | null
  instantiations: number
  instantiatedModules: string[]
  openConfigs: unknown[]
  offeredBundles: unknown[]
  workerScripts: string[]
  terminatedWorkers: number
  closedConnections: number
  terminatedDatabases: number
  queries: string[]
  responses: Map<string, FakeColumn[]>
  registrations: Registration[]
  droppedFiles: string[]
  progressSteps: ProgressStep[]
}

const harness = vi.hoisted(() => {
  // One literal, so a field added to HarnessState cannot be missed by reset()
  // and leak across tests.
  const initialState = (): HarnessState => ({
    bootFailure: null,
    queryFailure: null,
    registerFailure: null,
    instantiations: 0,
    instantiatedModules: [],
    openConfigs: [],
    offeredBundles: [],
    workerScripts: [],
    terminatedWorkers: 0,
    closedConnections: 0,
    terminatedDatabases: 0,
    queries: [],
    responses: new Map<string, FakeColumn[]>(),
    registrations: [],
    droppedFiles: [],
    progressSteps: [],
  })

  const state: HarnessState = initialState()

  const reset = (): void => {
    Object.assign(state, initialState())
  }

  class FakeWorker {
    constructor(script: string) {
      state.workerScripts.push(script)
    }

    terminate(): void {
      state.terminatedWorkers += 1
    }
  }

  return { state, reset, FakeWorker }
})

vi.mock('@duckdb/duckdb-wasm', () => {
  const { state } = harness

  const makeTable = (columns: FakeColumn[]) => ({
    numRows: columns[0]?.values.length ?? 0,
    schema: {
      fields: columns.map((column) => ({
        name: column.name,
        type: { toString: () => column.type },
      })),
    },
    getChildAt: (position: number) => {
      const column = columns[position]

      return column ? { get: (row: number) => column.values[row] } : null
    },
  })

  class FakeConnection {
    async query(sql: string) {
      state.queries.push(sql)

      if (state.queryFailure) {
        throw state.queryFailure
      }

      return makeTable(state.responses.get(sql) ?? [])
    }

    async close(): Promise<void> {
      state.closedConnections += 1
    }
  }

  class FakeAsyncDuckDB {
    async instantiate(
      mainModule: string,
      _pthreadWorker: string | null,
      onProgress?: (progress: ProgressStep) => void,
    ): Promise<null> {
      state.instantiations += 1
      state.instantiatedModules.push(mainModule)

      if (onProgress) {
        for (const step of state.progressSteps) {
          onProgress(step)
        }
      }

      if (state.bootFailure) {
        throw state.bootFailure
      }

      return null
    }

    async open(config: unknown): Promise<void> {
      state.openConfigs.push(config)
    }

    async connect(): Promise<FakeConnection> {
      return new FakeConnection()
    }

    async registerFileHandle(
      name: string,
      handle: unknown,
      protocol: number,
      directIO: boolean,
    ): Promise<void> {
      if (state.registerFailure) {
        throw state.registerFailure
      }

      state.registrations.push({ name, handle, protocol, directIO })
    }

    async dropFile(name: string): Promise<null> {
      state.droppedFiles.push(name)

      return null
    }

    async terminate(): Promise<void> {
      state.terminatedDatabases += 1
    }
  }

  class FakeConsoleLogger {
    constructor(_level: number) {}
  }

  return {
    AsyncDuckDB: FakeAsyncDuckDB,
    ConsoleLogger: FakeConsoleLogger,
    LogLevel: { NONE: 0, DEBUG: 1, INFO: 2, WARNING: 3, ERROR: 4 },
    DuckDBDataProtocol: {
      BUFFER: 0,
      NODE_FS: 1,
      BROWSER_FILEREADER: 2,
      BROWSER_FSACCESS: 3,
      HTTP: 4,
      S3: 5,
    },
    selectBundle: async (bundles: unknown) => {
      state.offeredBundles.push(bundles)

      return {
        mainModule: '/assets/duckdb-eh.wasm',
        mainWorker: '/assets/duckdb-browser-eh.worker.js',
        pthreadWorker: null,
      }
    },
  }
})

beforeEach(async () => {
  await terminate()
  harness.reset()
  vi.stubGlobal('Worker', harness.FakeWorker)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('initialize', () => {
  it('boots once however many times it is called', async () => {
    await initialize()
    await initialize()
    await initialize()

    expect(harness.state.instantiations).toBe(1)
  })

  it('lets concurrent callers join the same boot', async () => {
    await Promise.all([initialize(), initialize(), initialize()])

    expect(harness.state.instantiations).toBe(1)
  })

  it('reports download progress as a ratio', async () => {
    harness.state.progressSteps = [
      { bytesLoaded: 0, bytesTotal: 1000 },
      { bytesLoaded: 250, bytesTotal: 1000 },
      { bytesLoaded: 1000, bytesTotal: 1000 },
    ]

    const seen: number[] = []
    await initialize((progress) => seen.push(progress.ratio))

    expect(seen).toEqual([0, 0.25, 1])
  })

  it('survives a zero-byte total rather than reporting NaN', async () => {
    harness.state.progressSteps = [{ bytesLoaded: 0, bytesTotal: 0 }]

    const seen: number[] = []
    await initialize((progress) => seen.push(progress.ratio))

    expect(seen).toEqual([0])
  })

  it('stops reporting to a handler once its own call has settled', async () => {
    harness.state.bootFailure = new Error('network gone')
    harness.state.progressSteps = [{ bytesLoaded: 1, bytesTotal: 4 }]

    const abandoned: number[] = []
    await expect(initialize((progress) => abandoned.push(progress.ratio))).rejects.toBeInstanceOf(
      EngineError,
    )
    expect(abandoned).toEqual([0.25])

    harness.state.bootFailure = null
    const seen: number[] = []
    await initialize((progress) => seen.push(progress.ratio))

    expect(seen).toEqual([0.25])
    expect(abandoned).toEqual([0.25])
  })

  it('raises an EngineError and releases the worker when the boot fails', async () => {
    harness.state.bootFailure = new Error('WebAssembly.instantiate(): expected magic word')

    const failure = await initialize().catch((cause: unknown) => cause)

    expect(failure).toBeInstanceOf(EngineError)
    expect(failure).toMatchObject({ message: expect.stringContaining('expected magic word') })
    expect(harness.state.terminatedWorkers).toBe(1)
  })

  it('lets a failed boot be retried rather than replaying the rejection', async () => {
    harness.state.bootFailure = new Error('network gone')
    await expect(initialize()).rejects.toBeInstanceOf(EngineError)

    harness.state.bootFailure = null
    await expect(initialize()).resolves.toBeUndefined()

    expect(harness.state.instantiations).toBe(2)
  })

  it('opens the database with decimals cast to double', async () => {
    await initialize()

    expect(harness.state.openConfigs).toEqual([{ query: { castDecimalToDouble: true } }])
  })

  it('offers DuckDB only the bundles that run without cross-origin isolation', async () => {
    await initialize()

    const [offered] = harness.state.offeredBundles

    expect(offered).toMatchObject({
      mvp: { mainModule: expect.any(String), mainWorker: expect.any(String) },
      eh: { mainModule: expect.any(String), mainWorker: expect.any(String) },
    })
    expect(offered).not.toHaveProperty('coi')
    expect(JSON.stringify(offered)).not.toContain('jsdelivr')
  })
})

describe('query', () => {
  it('refuses to run before the engine has been started', async () => {
    await expect(query('SELECT 1')).rejects.toBeInstanceOf(EngineError)
    expect(harness.state.queries).toEqual([])
  })

  it('turns an Arrow table into plain columns and rows', async () => {
    harness.state.responses.set('SELECT * FROM sales', [
      { name: 'city', type: 'Utf8', values: ['Leeds', 'Hull'] },
      { name: 'visits', type: 'Int64', values: [3n, 0n] },
      { name: 'rate', type: 'Float64', values: [0.5, null] },
    ])

    await initialize()
    const result = await query('SELECT * FROM sales')

    expect(result.columns).toEqual([
      { name: 'city', type: 'Utf8', kind: 'string' },
      { name: 'visits', type: 'Int64', kind: 'bigint' },
      { name: 'rate', type: 'Float64', kind: 'number' },
    ])
    expect(result.rows).toEqual([
      ['Leeds', 3n, 0.5],
      ['Hull', 0n, null],
    ])
    expect(result.rowCount).toBe(2)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('keeps both columns when a query names two of them the same', async () => {
    // DuckDB really does answer `SELECT 1 AS a, 2 AS a` with two columns called
    // `a`. Rows keyed by name would return one of them.
    harness.state.responses.set('SELECT 1 AS a, 2 AS a', [
      { name: 'a', type: 'Int32', values: [1] },
      { name: 'a', type: 'Int32', values: [2] },
    ])

    await initialize()
    const result = await query('SELECT 1 AS a, 2 AS a')

    expect(result.columns).toHaveLength(2)
    expect(result.rows).toEqual([[1, 2]])
  })

  it('returns an empty result without inventing a row', async () => {
    harness.state.responses.set('SELECT 1 WHERE false', [])

    await initialize()
    const result = await query('SELECT 1 WHERE false')

    expect(result.rows).toEqual([])
    expect(result.rowCount).toBe(0)
  })

  it('surfaces a DuckDB failure as a QueryError with the message intact', async () => {
    const duckdbMessage = 'Binder Error: Referenced column "nope" not found in FROM clause!'
    harness.state.queryFailure = new Error(duckdbMessage)

    await initialize()
    const failure = await query('SELECT nope FROM sales').catch((cause: unknown) => cause)

    expect(failure).toBeInstanceOf(QueryError)

    if (!(failure instanceof QueryError)) {
      throw failure
    }

    expect(failure.message).toBe(duckdbMessage)
    expect(failure.sql).toBe('SELECT nope FROM sales')
    expect(failure.cause).toBe(harness.state.queryFailure)
  })
})

describe('registerFile', () => {
  it('hands DuckDB the file itself, never its contents', async () => {
    const file = new File(['city,visits\nLeeds,3\n'], 'sales.csv', { type: 'text/csv' })

    await initialize()
    const name = await registerFile(file)

    expect(name).toBe('sales.csv')
    expect(harness.state.registrations).toEqual([
      { name: 'sales.csv', handle: file, protocol: 2, directIO: true },
    ])
  })

  it('keeps one file per session, dropping whatever was there before', async () => {
    await initialize()
    await registerFile(new File([''], 'sales.csv'))
    await registerFile(new File([''], 'sales.csv'))
    await registerFile(new File([''], 'weather.parquet'))

    expect(harness.state.droppedFiles).toEqual(['sales.csv', 'sales.csv'])
    expect(harness.state.registrations.map((entry) => entry.name)).toEqual([
      'sales.csv',
      'sales.csv',
      'weather.parquet',
    ])
  })

  it('registers the first file without dropping anything', async () => {
    await initialize()
    await registerFile(new File([''], 'sales.csv'))

    expect(harness.state.droppedFiles).toEqual([])
  })

  it('reports a registration failure as an EngineError naming the file', async () => {
    await initialize()
    harness.state.registerFailure = new Error('Out of Memory Error: failed to allocate block')

    const failure = await registerFile(new File([''], 'sales.csv')).catch(
      (cause: unknown) => cause,
    )

    expect(failure).toBeInstanceOf(EngineError)
    expect(failure).toMatchObject({
      message: expect.stringContaining('sales.csv'),
    })
    expect(failure).toMatchObject({
      message: expect.stringContaining('failed to allocate block'),
    })
  })
})

describe('describeTable', () => {
  it('describes a registered file by name and keeps DuckDB type names', async () => {
    harness.state.responses.set('DESCRIBE SELECT * FROM "sales.csv"', [
      { name: 'column_name', type: 'Utf8', values: ['city', 'visits'] },
      { name: 'column_type', type: 'Utf8', values: ['VARCHAR', 'BIGINT'] },
    ])

    await initialize()

    await expect(describeTable('sales.csv')).resolves.toEqual([
      { name: 'city', type: 'VARCHAR', kind: 'string' },
      { name: 'visits', type: 'BIGINT', kind: 'bigint' },
    ])
  })

  it('rejects a name it cannot describe rather than returning half a schema', async () => {
    harness.state.responses.set('DESCRIBE SELECT * FROM "odd"', [
      { name: 'column_name', type: 'Utf8', values: [null] },
      { name: 'column_type', type: 'Utf8', values: ['VARCHAR'] },
    ])

    await initialize()

    await expect(describeTable('odd')).rejects.toBeInstanceOf(EngineError)
  })

  it('does not read DESCRIBE output by column position', async () => {
    // DuckDB puts column_name first today. Reading by position would pass now
    // and break the day it does not.
    harness.state.responses.set('DESCRIBE SELECT * FROM "sales.csv"', [
      { name: 'null', type: 'Utf8', values: ['YES'] },
      { name: 'column_type', type: 'Utf8', values: ['VARCHAR'] },
      { name: 'column_name', type: 'Utf8', values: ['city'] },
    ])

    await initialize()

    await expect(describeTable('sales.csv')).resolves.toEqual([
      { name: 'city', type: 'VARCHAR', kind: 'string' },
    ])
  })
})

describe('quoteIdentifier', () => {
  it('doubles embedded quotes so a name cannot escape its own quoting', () => {
    expect(quoteIdentifier('sales.csv')).toBe('"sales.csv"')
    expect(quoteIdentifier('we"rd')).toBe('"we""rd"')
    expect(quoteIdentifier('a" ; DROP TABLE t; --')).toBe('"a"" ; DROP TABLE t; --"')
  })
})

describe('terminate', () => {
  it('closes the connection and lets a later initialize boot again', async () => {
    await initialize()
    await terminate()

    expect(harness.state.closedConnections).toBe(1)
    expect(harness.state.terminatedDatabases).toBe(1)

    await initialize()

    expect(harness.state.instantiations).toBe(2)
  })

  it('is a no-op when nothing has been started', async () => {
    await expect(terminate()).resolves.toBeUndefined()
    expect(harness.state.terminatedDatabases).toBe(0)
  })
})
