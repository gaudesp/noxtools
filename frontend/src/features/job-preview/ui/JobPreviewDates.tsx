import { type Job } from "@/entities/job"

const formatDate = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleString()
}

type Props = {
  job: Job
}

export default function JobPreviewDates({ job }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 text-xs text-slate-500 md:grid-cols-3">
      <p>Created: {formatDate(job.created_at)}</p>
      {job.started_at && <p>Started: {formatDate(job.started_at)}</p>}
      {job.completed_at && <p>Completed: {formatDate(job.completed_at)}</p>}
    </div>
  )
}
