import { Section } from "@/app/layout"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import Table from "@/shared/ui/Table"
import Pagination from "@/shared/ui/Pagination"
import { useNotifications } from "@/shared/notifications"
import { useNoxelizerJobs } from "@/features/noxelizer/model"

type NoxelizerJobsStore = ReturnType<typeof useNoxelizerJobs>

interface Props {
  store: NoxelizerJobsStore
  onSelectJob: () => void
}

export default function NoxelizerTaskHistory({ store, onSelectJob }: Props) {
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
      title={`Task history (${pagedItems.length} of ${total})`}
      description="Latest tasks for this tool. Click a row to open the preview modal."
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
          onSelectJob()
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
