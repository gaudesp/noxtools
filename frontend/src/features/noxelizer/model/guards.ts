import type { Job } from "@/entities/job"
import type { NoxelizerJob } from "../api/types"

export function isJob(job: Job): job is NoxelizerJob {
  return job.tool === "noxelizer"
}
