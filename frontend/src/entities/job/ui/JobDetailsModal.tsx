import { type ReactNode } from "react"
import useJobStream from "../model/useJobStream"
import JobDetailsPanel from "./JobDetailsPanel"

type Props = {
  jobId: string | null
  open: boolean
  onClose: () => void
  renderResult: (job: any) => ReactNode
  footer?: ReactNode
}

export default function JobDetailsModal({
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
    <JobDetailsPanel job={job} open={open} onClose={onClose} footer={footer}>
      {renderResult(job)}
    </JobDetailsPanel>
  )
}
