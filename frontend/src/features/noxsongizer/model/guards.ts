import type { Job } from "@/entities/job"
import type { NoxsongizerJob } from "../api/types"

export function isJob(job: Job): job is NoxsongizerJob {
  return job.tool === "noxsongizer"
}
