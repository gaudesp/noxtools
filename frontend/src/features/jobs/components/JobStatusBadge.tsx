import { type JobStatus } from "../../../lib/api/core"

type Props = {
  status: JobStatus
}

const STYLES: Record<JobStatus, string> = {
  pending: "bg-amber-500/15 text-amber-100 border border-amber-400/40",
  running: "bg-sky-500/15 text-sky-100 border border-sky-400/40",
  done: "bg-emerald-500/15 text-emerald-100 border border-emerald-400/40",
  error: "bg-rose-500/15 text-rose-100 border border-rose-400/40",
}

export default function JobStatusBadge({ status }: Props) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${STYLES[status]}`}>
      {label}
    </span>
  )
}
