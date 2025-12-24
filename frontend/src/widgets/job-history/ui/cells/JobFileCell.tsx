import type { Job } from "@/entities/job"
import { cleanFileName } from "@/entities/file"

export default function JobFileCell({ job }: { job: Job }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-slate-100">
        {cleanFileName(job.input_filename) || job.input_filename || "Unknown file"}
      </p>
    </div>
  )
}
