import type { FileRow } from "@/stores/translation-store"
import type { FileStateKind } from "@/types/generated/FileStateKind"

export type BatchState = "queued" | "in-flight" | "landing" | "done" | "retrans"
const IN_FLIGHT: FileStateKind[] = ["translating", "retranslating", "cleanup", "verifying"]

/** Count of FULLY-completed batches = 0-based index of the frontier cell.
 *  `row.batch` is the completed count while translating; while retranslating the
 *  reported batch is being retried, so one fewer is actually done.
 *  (Confirmed against src-tauri/src/translation/pipeline.rs:363-442.) */
function doneBatches(row: FileRow): number {
  return row.state === "retranslating" ? Math.max(0, row.batch - 1) : row.batch
}

/** Cell state for batch index `i` (0..totalBatches-1) of a file. */
export function batchCellState(row: FileRow, i: number): BatchState {
  const done = doneBatches(row)
  if (i < done) return "done"
  if (i > done) return "queued"
  if (row.state === "retranslating") return "retrans"
  if (row.state === "translating") return "in-flight"
  return "done"
}

/** The file to spotlight as the hero: first in-flight file in insertion order. */
export function pickHero(files: Record<string, FileRow>): string | null {
  for (const [name, f] of Object.entries(files)) if (IN_FLIGHT.includes(f.state)) return name
  return null
}

export interface RunIntegrity { done: number; total: number; retranslated: number }
export function runIntegrity(files: Record<string, FileRow>): RunIntegrity {
  let done = 0, total = 0, retranslated = 0
  for (const f of Object.values(files)) {
    total += f.totalBatches
    const terminal = f.state === "done" || f.state === "warning"
    done += terminal ? f.totalBatches : Math.min(doneBatches(f), f.totalBatches)
    retranslated += f.retries
  }
  return { done, total, retranslated }
}
