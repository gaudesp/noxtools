import { type Job } from "@/lib/api/core"
import JobStatusBadge from "@/features/jobs/components/JobStatusBadge"

type Props = {
  job: Job
  onClose: () => void
}

export default function Header({ job, onClose }: Props) {
  return (
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
  )
}
