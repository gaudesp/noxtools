import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"
import { JobDetailsModal, useJobStream, type Job } from "@/entities/job"
import { usePagination, useSelection } from "@/shared/lib"
import { JobHistory } from "@/widgets/job-history"

import {
  Preview as NoxsongizerPreview,
  Result as NoxsongizerResult,
  toolColor as NoxsongizerToolColor,
  type NoxsongizerJob,
} from "@/features/noxsongizer"
import {
  Preview as NoxelizerPreview,
  Result as NoxelizerResult,
  toolColor as NoxelizerToolColor,
  type NoxelizerJob,
} from "@/features/noxelizer"
import {
  Preview as NoxtubizerPreview,
  Result as NoxtubizerResult,
  toolColor as NoxtubizerToolColor,
  type NoxtubizerJob,
} from "@/features/noxtubizer"
import {
  Preview as NoxtunizerPreview,
  Result as NoxtunizerResult,
  toolColor as NoxtunizerToolColor,
  type NoxtunizerJob,
} from "@/features/noxtunizer"

function renderJobResult(job: Job) {
  switch (job.tool) {
    case "noxsongizer":
      return <NoxsongizerResult job={job as NoxsongizerJob} />
    case "noxelizer":
      return <NoxelizerResult job={job as NoxelizerJob} />
    case "noxtubizer":
      return <NoxtubizerResult job={job as NoxtubizerJob} />
    case "noxtunizer":
      return <NoxtunizerResult job={job as NoxtunizerJob} />
    default:
      return null
  }
}

function renderJobPreview(job: Job) {
  switch (job.tool) {
    case "noxsongizer":
      return <NoxsongizerPreview job={job as NoxsongizerJob} />
    case "noxelizer":
      return <NoxelizerPreview job={job as NoxelizerJob} />
    case "noxtubizer":
      return <NoxtubizerPreview job={job as NoxtubizerJob} />
    case "noxtunizer":
      return <NoxtunizerPreview job={job as NoxtunizerJob} />
    default:
      return null
  }
}

export default function Page() {
  const { setHeader, setFooter } = useLayout()
  const { jobs, loading, error, deleteJob, getJobById } = useJobStream()

  const { pagedItems, total, page, pageSize, setPage } = usePagination<Job>({
    items: jobs,
    pageSize: 10,
  })

  const { selectedItem, select, clear } = useSelection<Job>({
    getItemById: getJobById,
  })

  const [open, setOpen] = useState(false)

  useEffect(() => {
    setHeader({
      title: "Dashboard",
      description: "Overall view of jobs across all tools.",
      eyebrow: "Global overview",
    })
  }, [setHeader])

  useEffect(() => {
    setFooter(jobs, loading)
    return () => setFooter([], false)
  }, [jobs, loading, setFooter])

  return (
    <div className="flex flex-col gap-8">
      <JobHistory
        store={{
          pagedItems,
          total,
          page,
          pageSize,
          setPage,
          streamError: error,
          loading,
          deleteJob,
          select: (id: string) => select(id),
        }}
        onSelectJob={() => {
          setOpen(true)
        }}
        title="Task history"
        description="Latest tasks. Click a row to open the preview."
        showToolColumn
      />

      <JobDetailsModal
        job={selectedItem}
        open={open}
        onClose={() => {
          setOpen(false)
          clear()
        }}
        renderResult={(job) => renderJobResult(job as Job)}
        renderPreview={(job) => renderJobPreview(job as Job)}
        toolColor={(tool) => {
          switch (tool) {
            case "noxsongizer":
              return NoxsongizerToolColor
            case "noxelizer":
              return NoxelizerToolColor
            case "noxtubizer":
              return NoxtubizerToolColor
            case "noxtunizer":
              return NoxtunizerToolColor
          }
        }}
        onDeleteJob={async (job) => {
          await deleteJob(job.id)
          setOpen(false)
          clear()
        }}
      />
    </div>
  )
}
