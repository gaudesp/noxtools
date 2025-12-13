import { useState } from "react"
import { Form, Result } from "@/features/noxtubizer/ui"
import { useNoxtubizerJobs } from "@/features/noxtubizer/model"
import { JobHistory } from "@/widgets/job-history"
import { JobPreviewModal } from "@/widgets/job-preview"
import { type Job } from "@/entities/job"
import { type NoxtubizerJobResult } from "@/features/noxtubizer/api"

export default function NoxtubizerPage() {
  const store = useNoxtubizerJobs()

  const [selectedJob, setSelectedJob] =
    useState<Job<unknown, NoxtubizerJobResult> | null>(null)

  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-8">
      <Form />

      <JobHistory
        store={store}
        onSelectJob={(job) => {
          setSelectedJob(job as Job<unknown, NoxtubizerJobResult>)
          setOpen(true)
        }}
      />

      <JobPreviewModal<NoxtubizerJobResult>
        job={selectedJob}
        open={open}
        onClose={() => setOpen(false)}
        renderResult={(job) => <Result job={job} />}
      />
    </div>
  )
}
