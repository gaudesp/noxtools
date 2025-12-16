import { JobDeleteButton, type Job } from "@/entities/job"

export default function JobActionsCell({
  job,
  onDelete,
}: {
  job: Job
  onDelete?: (job: Job) => void
}) {
  return (
    <JobDeleteButton
      job={job}
      onDelete={onDelete}
    />
  )
}
