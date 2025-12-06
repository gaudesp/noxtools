import { useEffect, type ReactNode } from "react"
import { type Job } from "../../lib/api"
import JobStatusBadge from "./JobStatusBadge"

type Props = {
  job: Job | null
  open: boolean
  onClose: () => void
  renderContent?: (job: Job) => ReactNode
}

const formatDate = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleString()
}

export default function JobDetailsModal({ job, open, onClose, renderContent }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open || !job) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        aria-label="Close modal"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />
      <div className="relative z-10 w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-lg shadow-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Job {job.id}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {job.input_filename || "Unknown file"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <JobStatusBadge status={job.status} />
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {job.tool}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-2 text-xs text-slate-500">
          <p>Created: {formatDate(job.created_at)}</p>
          {job.started_at && <p>Started: {formatDate(job.started_at)}</p>}
          {job.completed_at && <p>Completed: {formatDate(job.completed_at)}</p>}
        </div>

        <div className="mt-6">
          {renderContent ? (
            renderContent(job)
          ) : (
            <p className="text-sm text-slate-200">No details available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
