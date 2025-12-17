import { type ReactNode } from "react"
import type { Job } from "../model/types"
import JobDeleteButton from "./JobDeleteButton"
import JobCancelButton from "./JobCancelButton"
import JobRetryButton from "./JobRetryButton"

type Props = {
  job: Job
  onDelete?: (job: Job) => void | Promise<void>
  onCancel?: (job: Job) => void | Promise<void>
  onRetry?: (job: Job) => void | Promise<void>
}

export default function JobActions({
  job,
  onDelete,
  onCancel,
  onRetry,
}: Props) {
  const actions: ReactNode[] = []

  if (job.status === "running" && onCancel) {
    actions.push(
      <JobCancelButton key="cancel" job={job} onCancel={onCancel} />,
    )
  }

  if ((job.status === "error" || job.status === "aborted") && onRetry) {
    actions.push(
      <JobRetryButton key="retry" job={job} onRetry={onRetry} />,
    )
  }

  if (onDelete && job.status !== "running") {
    actions.push(
      <JobDeleteButton key="delete" job={job} onDelete={onDelete} />,
    )
  }

  if (!actions.length) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {actions}
    </div>
  )
}
