import type { Job } from "@/entities/job"
import type { NoxtubizerJob } from "../api/types"

export function isJob(job: Job): job is NoxtubizerJob {
  return job.tool === "noxtubizer"
}
