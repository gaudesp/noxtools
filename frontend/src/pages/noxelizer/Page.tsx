import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"
import { JobDetailsModal } from "@/features/job-preview"
import { Form, Result, useNoxelizerJobs } from "@/features/noxelizer"
import { JobHistory } from "@/widgets/job-history"

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

      <JobDetailsModal
        jobId={store.selectedId}
        open={open}
        onClose={() => setOpen(false)}
        renderResult={(job) => <Result job={job} />}
      />
    </div>
  )
}
