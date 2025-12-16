import { JobDateTag, type Job } from "@/entities/job"

export default function JobStartedCell({ job }: { job: Job }) {
  return (
    <JobDateTag
      date={job.started_at}
      tone="info"
    />
  )
}
