import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"
import { JobDetailsModal } from "@/entities/job"
import { Form, Result, useJobs } from "@/features/noxsongizer"
import { JobHistory } from "@/widgets/job-history"

export default function Page() {
  const { setHeader, setFooter } = useLayout()
  const store = useJobs()

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

      <JobDetailsModal
        job={store.selectedItem}
        open={open}
        onClose={() => setOpen(false)}
        renderResult={(job) => <Result job={job} />}
      />
    </div>
  )
}
