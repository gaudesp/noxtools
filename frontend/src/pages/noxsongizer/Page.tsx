import { useState } from "react"
import { Form, ResultPreview } from "@/features/noxsongizer/ui"
import { useNoxsongizerJobs } from "@/features/noxsongizer/model"
import { JobHistory } from "@/widgets/job-history"
import { JobPreviewModal } from "@/widgets/job-preview"
import { type Job } from "@/entities/job"
import { type NoxsongizerJobResult } from "@/features/noxsongizer/api"

export default function NoxsongizerPage() {
  const store = useNoxsongizerJobs()

  const [selectedJob, setSelectedJob] =
    useState<Job<unknown, NoxsongizerJobResult> | null>(null)

  const [open, setOpen] = useState(false)

  return (
    <>
      <Form />

      <JobHistory
        store={store}
        onSelectJob={(job) => {
          setSelectedJob(job as Job<unknown, NoxsongizerJobResult>)
          setOpen(true)
        }}
      />

      <JobPreviewModal
        job={selectedJob}
        open={open}
        onClose={() => setOpen(false)}
        renderResult={(job) => <ResultPreview job={job} />}
      />
    </>
  )
}
