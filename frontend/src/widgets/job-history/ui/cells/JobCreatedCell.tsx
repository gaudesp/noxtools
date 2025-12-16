import { JobDateTag, type Job } from "@/entities/job"

export default function JobCreatedCell({ job }: { job: Job }) {
  return (
    <JobDateTag
      date={job.created_at}
      tone="warning"
    />
  )
}
