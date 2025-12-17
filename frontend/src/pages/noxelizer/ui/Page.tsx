import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"
import { JobDetailsModal } from "@/entities/job"
import { Form, Preview, Result, useJobs, toolColor, toolEyebrow, toolDescription, toolName } from "@/features/noxelizer"
import { JobHistory } from "@/widgets/job-history"

export default function Page() {
  const { setHeader, setFooter } = useLayout()
  const store = useJobs()

  const [open, setOpen] = useState(false)

  useEffect(() => {
    setHeader({
      title: toolName,
      description: toolDescription,
      eyebrow: toolEyebrow,
      eyebrowClassName: toolColor,
    })

    setFooter(store.jobs, store.loading)
    return () => setFooter([], false)
  }, [store.jobs, store.loading, setHeader, setFooter])

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
        onClose={() => {
          setOpen(false)
          store.clear()
        }}
        renderResult={(job) => <Result job={job} />}
        renderPreview={(job) => <Preview job={job} />}
        toolColor={() => toolColor}
        onDeleteJob={async (job) => {
          await store.deleteJob(job.id)
          setOpen(false)
          store.clear()
        }}
        onCancelJob={async (job) => {
          await store.cancelJob(job.id)
        }}
        onRetryJob={async (job) => {
          await store.retryJob(job.id)
        }}
      />
    </div>
  )
}
