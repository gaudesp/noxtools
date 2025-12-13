import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"

import { Form, Result } from "@/features/noxsongizer/ui"
import { useNoxsongizerJobs } from "@/features/noxsongizer/model"

import { JobHistory } from "@/widgets/job-history"
import { JobPreviewModal } from "@/widgets/job-preview"

export default function NoxsongizerPage() {
  const { setHeader, setFooter } = useLayout()
  const store = useNoxsongizerJobs()

  const [open, setOpen] = useState(false)

  useEffect(() => {
    setHeader({
      title: "Noxsongizer",
      description: "Split a song into separate audio stems (vocals, bass, drums and other).",
      eyebrow: "Audio separation",
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
