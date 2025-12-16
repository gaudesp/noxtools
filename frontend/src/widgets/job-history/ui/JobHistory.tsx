import type { Job } from "@/entities/job"
import { Section, NoticeMessage, Pagination, useNotifications } from "@/shared/ui"
import JobTable from "./JobTable"
import type { JobHistoryStore } from "../model/types"

type Props = {
  store: JobHistoryStore
  onSelectJob: (job: Job) => void
  title?: string
  description?: string
}

export default function JobHistory({
  store,
  onSelectJob,
  title = "Task history",
  description = "Latest tasks. Click a row to open the preview.",
}: Props) {
  const { notify } = useNotifications()

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
        onDeleteJob={async (job) => {
          try {
            await deleteJob(job.id)
            notify("Job deleted.", "success")
          } catch {
            notify("Failed to delete job.", "danger")
          }
        }}
      />
    </Section>
  )
}
