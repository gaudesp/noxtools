import type { Job } from "@/entities/job"
import type { NoxtunizerJob } from "../api/types"

export function isJob(job: Job): job is NoxtunizerJob {
  return job.tool === "noxtunizer"
}
