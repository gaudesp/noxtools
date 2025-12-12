import { type Job } from "@/lib/api/core"
import {
  type NoxtunizerJob,
  type NoxtunizerJobResult,
} from "@/features/noxtunizer/api"

export function isNoxtunizerJob(job: Job): boolean {
  return job.tool === "noxtunizer"
}

export function getNoxtunizerResult(job: Job): NoxtunizerJobResult | null {
  if (!isNoxtunizerJob(job)) return null
  return (job as NoxtunizerJob).result ?? null
}
