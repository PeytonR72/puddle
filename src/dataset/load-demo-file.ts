/**
 * Turning Puddle's own bundled asset into the same `File` shape a drop or the
 * picker would hand over, so everything past this point — engine boot, view
 * creation, description — is the one ingest path in `use-dataset.ts` rather
 * than a second one grown beside it.
 */
import { DEMO_FILE_NAME, DEMO_FILE_URL } from './demo-dataset'

export async function loadDemoFile(): Promise<File> {
  const response = await fetch(DEMO_FILE_URL)

  if (!response.ok) {
    throw new Error(`Fetching the demo dataset returned ${response.status} ${response.statusText}.`)
  }

  const blob = await response.blob()

  return new File([blob], DEMO_FILE_NAME, { type: 'text/csv' })
}
