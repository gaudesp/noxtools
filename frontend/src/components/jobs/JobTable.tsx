import { useState, type MouseEvent } from "react"
import { type Job } from "../../lib/api"
import ErrorMessage from "../common/ErrorMessage"
import DeleteConfirmModal from "./DeleteConfirmModal"
import JobPreview from "./JobPreview"
import JobStatusBadge from "./JobStatusBadge"

type Props = {
  jobs: Job[]
  total: number
  pageSize: number
  currentPage: number
  onPageChange: (page: number) => void
  onSelectJob?: (job: Job) => void
  onDeleteJob?: (job: Job) => void
  loading?: boolean
  error?: string | null
  showHeader?: boolean
  bordered?: boolean
}

const formatDate = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleString()
}

export default function JobTable({
  jobs,
  total,
  pageSize,
  currentPage,
  onPageChange,
  onSelectJob,
  onDeleteJob,
  loading,
  error,
  showHeader = true,
  bordered = true,
}: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1)
  }

  return (
    <div
      className={[
        "bg-slate-900",
        bordered ? "border border-slate-800 rounded-lg" : "rounded-none border-0",
      ].join(" ")}
    >
      {showHeader ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Jobs</h3>
            <p className="text-xs text-slate-500">Showing {jobs.length} of {total}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPage <= 1}
              className="px-2 py-1 rounded border border-slate-700 disabled:opacity-50 hover:border-violet-500 transition"
            >
              Prev
            </button>
            <span className="text-slate-400">
              Page {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage >= totalPages}
              className="px-2 py-1 rounded border border-slate-700 disabled:opacity-50 hover:border-violet-500 transition"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {loading && (
        <div className="px-4 py-2 text-sm text-slate-400 flex items-center gap-2 border-b border-slate-800">
          <div className="h-4 w-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" aria-hidden />
          Loading jobs…
        </div>
      )}

      {error ? (
        <div className="px-4 py-3 border-b border-slate-800">
          <ErrorMessage title="Unable to load jobs" message={error} compact />
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-slate-200">
          <thead className="bg-slate-800/60 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Preview</th>
              <th className="px-4 py-3 text-left">File</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className={[
                  "border-t border-slate-800 first:border-t-0",
                  onSelectJob ? "hover:bg-slate-800/40 transition cursor-pointer" : "",
                ].join(" ")}
                onClick={() => onSelectJob && onSelectJob(job)}
              >
                <td className="px-4 py-3 align-middle">
                  <JobStatusBadge status={job.status} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <JobPreview job={job} />
                </td>
                <td className="px-4 py-3 align-middle text-slate-100">
                  {job.input_filename || "Unknown file"}
                  <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wide">
                    {job.tool}
                  </p>
                </td>
                <td className="px-4 py-3 align-middle text-slate-300">
                  {formatDate(job.created_at)}
                </td>
                <td className="px-4 py-3 align-middle text-right relative">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={job.status === "running"}
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation()
                        setConfirmDeleteId(job.id)
                      }}
                      className="text-xs px-2 py-1 rounded border border-rose-700 text-rose-200 hover:border-rose-500 hover:text-rose-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                  <DeleteConfirmModal
                    open={confirmDeleteId === job.id}
                    onCancel={(e?: MouseEvent) => {
                      if (e) e.stopPropagation()
                      setConfirmDeleteId(null)
                    }}
                    onConfirm={(e?: MouseEvent) => {
                      if (e) e.stopPropagation()
                      onDeleteJob && onDeleteJob(job)
                      setConfirmDeleteId(null)
                    }}
                  />
                </td>
              </tr>
            ))}
            {jobs.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No jobs to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
