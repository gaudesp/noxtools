import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"

import { Form, Result } from "@/features/noxtubizer/ui"
import { useNoxtubizerJobs } from "@/features/noxtubizer/model"

import { JobHistory } from "@/widgets/job-history"
import { JobPreviewModal } from "@/widgets/job-preview"

export default function NoxtubizerPage() {
  const { setHeader, setFooter } = useLayout()
  const store = useNoxtubizerJobs()

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
