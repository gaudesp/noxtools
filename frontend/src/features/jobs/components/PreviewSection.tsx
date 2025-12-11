import { type ReactNode } from "react"
import SectionCard from "../../../shared/components/SectionCard"
import { type Job } from "../../../lib/api"
import JobStatusBadge from "./JobStatusBadge"

type Props = {
  job: Job | null
  renderPreview: (job: Job) => ReactNode
  onClear?: () => void
  onOpenModal?: () => void
}

export default function PreviewSection({ job, renderPreview, onClear, onOpenModal }: Props) {
  const useModal = Boolean(onOpenModal)

  return (
    <SectionCard
      title="Preview"
      description="Select a job from the history to preview its output and download files."
    >
      {!job ? (
        <p className="text-sm text-slate-400">
          No job selected. Choose a job from the table above to see its details here.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Job {job.id}</p>
              <p className="text-xs text-slate-400">{job.input_filename || "Unknown file"}</p>
              <div className="flex items-center gap-2">
                <JobStatusBadge status={job.status} />
                <span className="text-[11px] uppercase tracking-wide text-slate-500">{job.tool}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onClear ? (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-xs px-3 py-1 rounded border border-slate-700 text-slate-200 hover:border-violet-400 transition"
                >
                  Clear selection
                </button>
              ) : null}
              {useModal ? (
                <button
                  type="button"
                  onClick={onOpenModal}
                  className="text-xs px-3 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white transition"
                >
                  Open preview
                </button>
              ) : null}
            </div>
          </div>

          {!useModal ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              {renderPreview(job)}
            </div>
          ) : (
            <div className="text-sm text-slate-400 border border-dashed border-slate-700 rounded-lg p-4 bg-slate-950/40">
              Preview opens in a modal. Click <span className="font-semibold text-slate-200">Open preview</span> to view details and downloads.
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}
