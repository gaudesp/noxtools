import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"

import { Form, ResultPreview } from "@/features/noxelizer/ui"
import { useNoxelizerJobs } from "@/features/noxelizer/model"
import { type Job } from "@/entities/job"
import { type NoxelizerJobResult } from "@/features/noxelizer/api"

import { JobHistory } from "@/widgets/job-history"
import { JobPreviewModal } from "@/widgets/job-preview"

export default function NoxelizerPage() {
  const { setHeader, setFooter } = useLayout()
  const store = useNoxelizerJobs()

  const [selectedJob, setSelectedJob] =
    useState<Job<unknown, NoxelizerJobResult> | null>(null)

  const [open, setOpen] = useState(false)

  useEffect(() => {
    setHeader({
      title: "Noxelizer",
      description: "Transform images into smooth depixelization reveal videos.",
      eyebrow: "Image to video",
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
          setSelectedJob(job as Job<unknown, NoxelizerJobResult>)
          setOpen(true)
        }}
      />

      <JobPreviewModal<NoxelizerJobResult>
        job={selectedJob}
        open={open}
        onClose={() => setOpen(false)}
        renderResult={(job) => <ResultPreview job={job} />}
      />
    </div>
  )
}
