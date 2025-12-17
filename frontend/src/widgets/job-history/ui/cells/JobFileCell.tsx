import type { Job } from "@/entities/job"

export default function JobFileCell({ job }: { job: Job }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-slate-100">
        {job.input_filename || "Unknown file"}
      </p>
    </div>
  )
}
