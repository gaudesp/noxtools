import { type ReactNode } from "react"
import { StatusBadge, type Job } from "@/entities/job"
import { Modal } from "@/shared/ui"

const formatDate = (iso?: string): string => {
  if (!iso) return ""
  return new Date(iso).toLocaleString()
}

type Props = {
  job: Job
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export default function JobDetailsPanel({
  job,
  open,
  onClose,
  children,
  footer,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      header={
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">
              Task preview
            </h2>
            <p className="text-xs text-slate-400">
              {job.tool.toUpperCase()} •{" "}
              {job.input_filename || "Unnamed input"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
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
      footer={footer}
    >
      <div className="grid grid-cols-1 gap-3 text-xs text-slate-500 md:grid-cols-3">
        <p>Created: {formatDate(job.created_at)}</p>
        {job.started_at && (
          <p>Started: {formatDate(job.started_at)}</p>
        )}
        {job.completed_at && (
          <p>Completed: {formatDate(job.completed_at)}</p>
        )}
      </div>

      <div className="mt-6">
        {children}
      </div>
    </Modal>
  )
}
