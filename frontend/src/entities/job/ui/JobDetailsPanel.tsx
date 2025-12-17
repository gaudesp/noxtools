import { type ReactNode } from "react"
import type { Job, JobTool } from "../model/types"
import StatusBadge from "./StatusBadge"
import JobDeleteButton from "./JobDeleteButton"
import JobMetaTags from "./JobMetaTags"
import JobDateTags from "./JobDateTag"
import { Modal } from "@/shared/ui"

type Props = {
  job: Job
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  renderPreview?: (job: Job) => ReactNode
  onDeleteJob?: (job: Job) => void | Promise<void>
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
                {job.input_filename || "Unnamed input"}
              </p>
              <p className="truncate text-xs text-slate-400">
                {job.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
            {onDeleteJob && (
              <JobDeleteButton job={job} onDelete={onDeleteJob} />
            )}
            <button
              type="button"
              className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              onClick={onClose}
            >
              Close
            </button>
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
