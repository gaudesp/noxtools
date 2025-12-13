import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"
import { type Job } from "@/entities/job"

import { Form, Result } from "@/features/noxtubizer/ui"
import { useNoxtubizerJobs } from "@/features/noxtubizer/model"
import { type NoxtubizerJobResult } from "@/features/noxtubizer/api"

import { JobHistory } from "@/widgets/job-history"
import { JobPreviewModal } from "@/widgets/job-preview"

export default function NoxtubizerPage() {
  const { setHeader, setFooter } = useLayout()
  const store = useNoxtubizerJobs()

  const [selectedJob, setSelectedJob] =
    useState<Job<unknown, NoxtubizerJobResult> | null>(null)

  const [open, setOpen] = useState(false)

  useEffect(() => {
    setHeader({
      title: "Noxtubizer",
      description: "Download audio, video, or both from YouTube with exact quality and format control.",
      eyebrow: "YouTube downloader",
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
