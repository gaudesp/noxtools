import { useEffect } from "react"
import { type Job } from "../../lib/api/core"
import JobStatusBadge from "../../components/jobs/JobStatusBadge"

type Props = {
  job: Job | null
  open: boolean
  onClose: () => void
  renderPreview: (job: Job) => React.ReactNode
}

const formatDate = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleString()
}

export default function JobPreviewModal({ job, open, onClose, renderPreview }: Props) {
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open || !job) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">
              Job preview
            </h2>
            <p className="text-xs text-slate-400">
              {job.tool.toUpperCase()} • {job.input_filename || "Unnamed input"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <JobStatusBadge status={job.status} />
            <button
              type="button"
              className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </header>

        <div className="px-5 py-4">
          <div className="grid grid-cols-1 gap-3 text-xs text-slate-500 md:grid-cols-3">
            <p>Created: {formatDate(job.created_at)}</p>
            {job.started_at ? <p>Started: {formatDate(job.started_at)}</p> : null}
            {job.completed_at ? <p>Completed: {formatDate(job.completed_at)}</p> : null}
          </div>

          <div className="mt-6">
            {renderPreview(job)}
          </div>
        </div>
      </div>
    </div>
  )
}
