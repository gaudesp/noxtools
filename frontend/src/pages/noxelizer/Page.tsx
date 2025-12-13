import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"

import { Form, Result } from "@/features/noxelizer/ui"
import { useNoxelizerJobs } from "@/features/noxelizer/model"

import { JobHistory } from "@/widgets/job-history"
import { JobPreviewModal } from "@/widgets/job-preview"

export default function NoxelizerPage() {
  const { setHeader, setFooter } = useLayout()
  const store = useNoxelizerJobs()

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
        onSelectJob={() => {
          setOpen(true)
        }}
      />

      <JobPreviewModal
        jobId={store.selectedId}
        open={open}
        onClose={() => setOpen(false)}
        renderResult={(job) => <Result job={job} />}
      />
    </div>
  )
}
