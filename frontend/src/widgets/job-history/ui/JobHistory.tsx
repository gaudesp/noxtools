import type { Job } from "@/entities/job"
import { Section, NoticeMessage, Pagination } from "@/shared/ui"
import JobTable from "./JobTable"
import type { JobHistoryStore } from "../model/types"
import { toolColor as noxsongizerColor } from "@/features/noxsongizer/config"
import { toolColor as noxelizerColor } from "@/features/noxelizer/config"
import { toolColor as noxtubizerColor } from "@/features/noxtubizer/config"
import { toolColor as noxtunizerColor } from "@/features/noxtunizer/config"

type Props = {
  store: JobHistoryStore
  onSelectJob: (job: Job) => void
  title?: string
  description?: string
  showToolColumn?: boolean
}

export default function JobHistory({
  store,
  onSelectJob,
  title = "Task history",
  description = "Latest tasks. Click a row to open the preview.",
  showToolColumn = false,
}: Props) {
  const toolColor = (tool: Job["tool"]) => {
    switch (tool) {
      case "noxsongizer":
        return noxsongizerColor
      case "noxelizer":
        return noxelizerColor
      case "noxtubizer":
        return noxtubizerColor
      case "noxtunizer":
        return noxtunizerColor
      default:
        return undefined
    }
  }

  const {
    pagedItems,
    total,
    page,
    pageSize,
    setPage,
    streamError,
    loading,
    deleteJob,
    select,
  } = store

  return (
    <Section
      title={`${title} (${pagedItems.length} of ${total})`}
      description={description}
      actions={
        <Pagination
          total={total}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={setPage}
        />
      }
      padded={false}
    >
      {streamError && (
        <div className="px-5 pt-5 pb-5">
          <NoticeMessage
            title="Unable to load tasks"
            message={streamError}
            tone="danger"
            compact
          />
        </div>
      )}

      <JobTable
        jobs={pagedItems}
        total={total}
        pageSize={pageSize}
        currentPage={page}
        loading={loading}
        error={null}
        onPageChange={setPage}
        onSelectJob={(job) => {
          select(job.id)
          onSelectJob(job)
        }}
        toolColor={toolColor}
        showToolColumn={showToolColumn}
        onDeleteJob={(job) => deleteJob(job.id)}
      />
    </Section>
  )
}
