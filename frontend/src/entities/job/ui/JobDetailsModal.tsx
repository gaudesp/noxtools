import { type ReactNode } from "react"
import type { Job } from "../model/types"
import JobDetailsPanel from "./JobDetailsPanel"

type Props = {
  job: Job | null
  open: boolean
  onClose: () => void
  renderResult: (job: any) => ReactNode
  footer?: ReactNode
}

export default function JobDetailsModal({
  job,
  open,
  onClose,
  renderResult,
  footer,
}: Props) {
  if (!job) return null

  return (
    <JobDetailsPanel job={job} open={open} onClose={onClose} footer={footer}>
      {renderResult(job)}
    </JobDetailsPanel>
  )
}
