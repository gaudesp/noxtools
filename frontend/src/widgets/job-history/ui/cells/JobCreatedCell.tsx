import type { Job } from "@/entities/job"

function formatDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString()
}

export default function JobCreatedCell({ job }: { job: Job }) {
  return <span className="text-slate-300">{formatDate(job.created_at)}</span>
}
