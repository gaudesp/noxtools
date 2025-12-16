import { type ReactNode } from "react"
import type { Job, JobTool } from "../model/types"
import JobDetailsPanel from "./JobDetailsPanel"

type Props = {
  job: Job | null
  open: boolean
  onClose: () => void
  renderResult: (job: any) => ReactNode
  footer?: ReactNode
  renderPreview?: (job: any) => ReactNode
  onDeleteJob?: (job: Job) => void | Promise<void>
  toolColor?: (tool: JobTool) => string | undefined
}

export default function JobDetailsModal({
  job,
  open,
  onClose,
  renderResult,
  footer,
  renderPreview,
  onDeleteJob,
  toolColor,
}: Props) {
  if (!job) return null

  return (
    <JobDetailsPanel
      job={job}
      open={open}
      onClose={onClose}
      footer={footer}
      renderPreview={renderPreview}
      onDeleteJob={onDeleteJob}
      toolColor={toolColor}
    >
      {renderResult(job)}
    </JobDetailsPanel>
  )
}
