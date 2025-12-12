import {
  type Job,
  type NoxelizerJob,
  type NoxelizerJobResult,
} from "@/features/noxelizer/api"

export function isNoxelizerJob(job: Job): boolean {
  return job.tool === "noxelizer"
}

export function getNoxelizerResult(job: Job): NoxelizerJobResult | null {
  if (!isNoxelizerJob(job)) return null
  return (job as NoxelizerJob).result ?? null
}
