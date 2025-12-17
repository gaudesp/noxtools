import { JobActions, type Job } from "@/entities/job"

export default function JobActionsCell({
  job,
  onDelete,
  onCancel,
  onRetry,
}: {
  job: Job
  onDelete?: (job: Job) => void
  onCancel?: (job: Job) => void
  onRetry?: (job: Job) => void
}) {
  return (
    <JobActions
      job={job}
      onDelete={onDelete}
      onCancel={onCancel}
      onRetry={onRetry}
    />
  )
}
