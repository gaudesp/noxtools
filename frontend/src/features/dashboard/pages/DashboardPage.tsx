import { useCallback, useEffect, useState } from "react"
import { Section } from "@/app/layout"
import { useLayout } from "@/app/layout"
import { useNotifications } from "@/shared/notifications"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import Table from "@/shared/ui/Table"
import Pagination from "@/shared/ui/Pagination"
import PreviewModal from "@/shared/ui/PreviewModal"
import { usePaginatedData } from "@/shared/hooks/usePaginatedData"
import { useSelection } from "@/shared/hooks/useSelection"
import { useTaskStream } from "@/modules/tasks/useTaskStream"
import NoxelizerResultPreview from "@/features/noxelizer/ui/ResultPreview"
import NoxtubizerResultPreview from "@/features/noxtubizer/ui/ResultPreview"
import NoxtunizerResultPreview from "@/features/noxtunizer/ui/ResultPreview"
import NoxsongizerResultPreview from "@/features/noxsongizer/ui/ResultPreview"
import { type Job } from "@/lib/api/core"

export default function Dashboard() {
  const [actionError, setActionError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { notify } = useNotifications()
  const { setHeader, setFooter } = useLayout()
  const { jobs, loading, error: streamError, deleteJob, getJobById } = useTaskStream()
  const { pagedItems, total, page, pageSize, setPage } = usePaginatedData<Job>({ items: jobs, pageSize: 10 })
  const { selectedId, selectedItem, select, clear } = useSelection<Job>({ getItemById: getJobById })

  useEffect(() => {
    setHeader({
      title: "Dashboard",
      description: "Monitor all tasks across tools and follow live updates.",
      eyebrow: "Tools overview",
    })
    setFooter(jobs, loading)
    return () => setFooter([], false)
  }, [jobs, loading])

  const renderTaskContent = useCallback((task: Job) => {
    if (task.tool === "noxsongizer") return <NoxsongizerResultPreview job={task} />
    if (task.tool === "noxelizer") return <NoxelizerResultPreview job={task} />
    if (task.tool === "noxtubizer") return <NoxtubizerResultPreview job={task} />
    if (task.tool === "noxtunizer") return <NoxtunizerResultPreview job={task} />
    return null
  }, [])

  return (
    <div className="flex flex-col gap-8">
      {actionError ? (
        <NoticeMessage title="Action failed" message={actionError} tone="danger" compact />
      ) : null}

      <Section
        title={`Task history (${pagedItems.length} of ${total})`}
        description="Latest tasks from every tool. Click a row to preview results."
        actions={<Pagination total={total} pageSize={pageSize} currentPage={page} onPageChange={(p) => setPage(p)} />}
        padded={false}
      >
        {streamError ? (
          <div className="px-5 pt-5 pb-5">
            <NoticeMessage title="Unable to load tasks" message={streamError} tone="danger" compact />
          </div>
        ) : null}

        <Table
          tasks={pagedItems}
          total={total}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={(p) => setPage(p)}
          onSelectTask={(task) => {
            select(task.id)
            setPreviewOpen(true)
          }}
          onDeleteTask={async (task) => {
            try {
              setActionError(null)
              await deleteJob(task.id)
              if (selectedId === task.id) {
                clear()
                setPreviewOpen(false)
              }
              notify("Job deleted.", "success")
            } catch (err) {
              console.error(err)
              setActionError("Failed to delete job.")
            }
          }}
          loading={loading}
          error={null}
          bordered={false}
          showHeader={false}
        />
      </Section>

      <PreviewModal
        task={selectedItem}
        open={Boolean(previewOpen && selectedItem)}
        onClose={() => {
          clear()
          setPreviewOpen(false)
        }}
        renderPreview={renderTaskContent}
      />
    </div>
  )
}
