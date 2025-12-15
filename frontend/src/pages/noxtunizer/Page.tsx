import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"

import { JobDetailsModal } from "@/features/job-preview"
import { Form, Result } from "@/features/noxtunizer/ui"
import { useNoxtunizerJobs } from "@/features/noxtunizer/model"

import { JobHistory } from "@/widgets/job-history"

export default function NoxtunizerPage() {
  const { setHeader, setFooter } = useLayout()
  const store = useNoxtunizerJobs()

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
