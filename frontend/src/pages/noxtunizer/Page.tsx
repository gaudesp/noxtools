import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"

import { Form, ResultPreview } from "@/features/noxtunizer/ui"
import { useNoxtunizerJobs } from "@/features/noxtunizer/model"
import { type Job } from "@/entities/job"
import { type NoxtunizerJobResult } from "@/features/noxtunizer/api"

import { JobHistory } from "@/widgets/job-history"
import { JobPreviewModal } from "@/widgets/job-preview"

export default function NoxtunizerPage() {
  const { setHeader, setFooter } = useLayout()
  const store = useNoxtunizerJobs()

  const [selectedJob, setSelectedJob] =
    useState<Job<unknown, NoxtunizerJobResult> | null>(null)

  const [open, setOpen] = useState(false)

  useEffect(() => {
    setHeader({
      title: "Noxtunizer",
      description: "Extract BPM, key and duration from any track.",
      eyebrow: "Musical analysis",
    })

    setFooter(store.pagedItems, store.loading)
    return () => setFooter([], false)
  }, [store.pagedItems, store.loading, setHeader, setFooter])

  return (
    <div className="flex flex-col gap-8">
      <Form />

      <JobHistory
        store={store}
        onSelectJob={(job) => {
          setSelectedJob(job as Job<unknown, NoxtunizerJobResult>)
          setOpen(true)
        }}
      />

      <JobPreviewModal<NoxtunizerJobResult>
        job={selectedJob}
        open={open}
        onClose={() => setOpen(false)}
        renderResult={(job) => <ResultPreview job={job} />}
      />
    </div>
  )
}
