import Section from "@/shared/ui/Section"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import Table from "@/shared/ui/Table"
import Pagination from "@/shared/ui/Pagination"
import { useNotifications } from "@/shared/ui/notifications"
import { type JobHistoryStore } from "../model/types"
import type { Job } from "@/entities/job"

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

      <Table
        tasks={pagedItems}
        total={total}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        onSelectTask={(task) => {
          select(task.id)
          onSelectJob(task)
        }}
        onDeleteTask={async (task) => {
          try {
            await deleteJob(task.id)
            notify("Job deleted.", "success")
          } catch {
            notify("Failed to delete job.", "danger")
          }
        }}
        loading={loading}
        error={null}
        bordered={false}
        showHeader={false}
      />
    </Section>
  )
}
