import { type ReactNode } from "react"
import { JobPreview } from "@/features/job-preview"
import { useJobStream } from "@/entities/job"

type Props = {
  jobId: string | null
  open: boolean
  onClose: () => void
  renderResult: (job: any) => ReactNode
  footer?: ReactNode
}

export default function JobPreviewModal({
  jobId,
  open,
  onClose,
  renderResult,
  footer,
}: Props) {
  const { getJobById } = useJobStream()
  const job = getJobById(jobId)

  if (!job) return null

  return (
    <JobPreview job={job} open={open} onClose={onClose} footer={footer}>
      {renderResult(job)}
    </JobPreview>
  )
}
