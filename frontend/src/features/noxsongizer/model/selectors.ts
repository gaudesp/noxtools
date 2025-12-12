import {
  type Job,
  type NoxsongizerJob,
  type NoxsongizerJobResult,
} from "@/features/noxsongizer/api"

export function isNoxsongizerJob(job: Job): boolean {
  return job.tool === "noxsongizer"
}

export function getNoxsongizerResult(job: Job): NoxsongizerJobResult | null {
  if (!isNoxsongizerJob(job)) return null
  return (job as NoxsongizerJob).result ?? null
}
