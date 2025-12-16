import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"
import { JobDetailsModal } from "@/entities/job"
import { Form, Result, useJobs } from "@/features/noxtubizer"
import { JobHistory } from "@/widgets/job-history"

export default function Page() {
  const { setHeader, setFooter } = useLayout()
  const store = useJobs()

  const [open, setOpen] = useState(false)

  useEffect(() => {
    setHeader({
      title: "Noxtubizer",
      description: "Extract audio from a YouTube video and convert it to MP3.",
      eyebrow: "YouTube audio",
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
        job={store.selectedItem}
        open={open}
        onClose={() => setOpen(false)}
        renderResult={(job) => <Result job={job} />}
      />
    </div>
  )
}
