import { type ReactNode } from "react"
import { type Job } from "@/entities/job"
import { JobPreview } from "@/features/job-preview"

type Props<R> = {
  job: Job<unknown, R> | null
  open: boolean
  onClose: () => void
  renderResult: (job: Job<unknown, R>) => ReactNode
  footer?: ReactNode
}

export default function JobPreviewModal<R>({
  job,
  open,
  onClose,
  renderResult,
  footer,
}: Props<R>) {
  if (!job) return null

  return (
    <JobPreview
      job={job}
      open={open}
      onClose={onClose}
      footer={footer}
    >
      {renderResult(job)}
    </JobPreview>
  )
}
