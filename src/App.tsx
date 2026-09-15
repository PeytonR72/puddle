import { EngineCheck } from './duckdb/EngineCheck'

export function App() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-mono text-2xl">Puddle</h1>
      <p className="mt-2 text-slate-600">
        A browser-local SQL notebook. Scaffold only — no interface yet.
      </p>

      {/* Temporary; goes when the real interface lands. */}
      <EngineCheck />
    </main>
  )
}
