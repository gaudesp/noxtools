import { type ReactNode } from "react"
import type { Job, JobTool } from "../model/types"
import StatusBadge from "./StatusBadge"
import JobActions from "./JobActions"
import JobMetaTags from "./JobMetaTags"
import JobDateTags from "./JobDateTag"
import { cleanFileName } from "@/entities/file"
import { CloseButton, Modal } from "@/shared/ui"

type Props = {
  job: Job
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  renderPreview?: (job: Job) => ReactNode
  onDeleteJob?: (job: Job) => void | Promise<void>
  onCancelJob?: (job: Job) => void | Promise<void>
  onRetryJob?: (job: Job) => void | Promise<void>
  toolColor?: (tool: JobTool) => string | undefined
}

export default function JobDetailsPanel({
  job,
  open,
  onClose,
  children,
  footer,
  renderPreview,
  onDeleteJob,
  onCancelJob,
  onRetryJob,
  toolColor,
}: Props) {
  const resolvedFooter = footer ?? (
    <JobMetaTags
      job={job}
      toolColor={toolColor}
      showDates={false}
    />
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      header={
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {renderPreview && (
              <div className="shrink-0">
                {renderPreview(job)}
              </div>
            )}

            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-semibold text-white">
                {job.id}
              </p>
              <p className="truncate text-xs text-slate-400">
                {cleanFileName(job.input_filename) || job.input_filename || "Unnamed input"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
            <JobActions
              job={job}
              onDelete={onDeleteJob}
              onCancel={onCancelJob}
              onRetry={onRetryJob}
            />
            <CloseButton onClick={onClose} />
          </div>
        </div>
      }
      footer={resolvedFooter}
    >
      <JobDateTags
        createdAt={job.created_at}
        startedAt={job.started_at}
        completedAt={job.completed_at}
        status={job.status}
      />

      <div className="mt-4">
        {children}
      </div>
    </Modal>
  )
}
