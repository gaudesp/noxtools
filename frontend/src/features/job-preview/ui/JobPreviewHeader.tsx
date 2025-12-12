import { type Job } from "@/entities/job"
import StatusBadge from "@/shared/ui/StatusBadge"

type Props = {
  job: Job
  onClose: () => void
}

export default function JobPreviewHeader({ job, onClose }: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-white">Task preview</h2>
        <p className="text-xs text-slate-400">
          {job.tool.toUpperCase()} • {job.input_filename || "Unnamed input"}
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
  )
}
