import { type Job } from "@/lib/api/core"

const formatDate = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleString()
}

export default function Dates({ job }: { job: Job }) {
  return (
    <div className="grid grid-cols-1 gap-3 text-xs text-slate-500 md:grid-cols-3">
      <p>Created: {formatDate(job.created_at)}</p>
      {job.started_at ? <p>Started: {formatDate(job.started_at)}</p> : null}
      {job.completed_at ? <p>Completed: {formatDate(job.completed_at)}</p> : null}
    </div>
  )
}
