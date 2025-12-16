import { JobDateTag, type Job } from "@/entities/job"

export default function JobCompletedCell({ job }: { job: Job }) {
  const tone = job.status === "error" ? "danger" : "success"

  return (
    <JobDateTag
      date={job.completed_at}
      tone={tone}
    />
  )
}
