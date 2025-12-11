import { useCallback, useEffect, useState } from "react"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import PreviewModal from "@/shared/ui/PreviewModal"
import Table from "@/shared/ui/Table"
import Pagination from "@/shared/ui/Pagination"
import Uploader from "@/shared/ui/Uploader"
import { Section } from "@/app/layout"
import { useLayout } from "@/app/layout"
import { useNotifications } from "@/shared/notifications"
import { usePaginatedData } from "@/shared/hooks/usePaginatedData"
import { useSelection } from "@/shared/hooks/useSelection"
import { useTaskStream } from "@/modules/tasks/useTaskStream"
import NoxsongizerResultPreview from "@/features/noxsongizer/components/ResultPreview"
import { uploadNoxsongizer, type Job } from "@/features/noxsongizer/api/api"

export default function NoxsongizerPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { notify } = useNotifications()
  const { setHeader, setFooter } = useLayout()
  const { jobs, loading, error: streamError, deleteJob, getJobById } = useTaskStream({ tool: "noxsongizer" })
  const { pagedItems, total, page, pageSize, setPage } = usePaginatedData<Job>({ items: jobs, pageSize: 10 })
  const { selectedId, selectedItem, select, clear } = useSelection<Job>({ getItemById: getJobById })

  useEffect(() => {
    setHeader({
      title: "Noxsongizer",
      description: "Split a song into separate audio stems (vocals, bass, drums and other).",
      eyebrow: "Audio separation",
    })

    setFooter(jobs, loading)

    return () => {
      setFooter([], false)
    }
  }, [jobs, loading])

  async function startUpload(files: File[]) {
    try {
      setIsUploading(true)
      setUploadError(null)
      setActionError(null)
      const res = await uploadNoxsongizer(files)
      const ids = res.jobs.map((j) => j.job_id)
      notify(`${ids.length} job(s) created.`, "success")
    } catch (err) {
      console.error(err)
      setUploadError("File upload failed. Please retry.")
    } finally {
      setIsUploading(false)
    }
  }

  const renderJobContent = useCallback(
    (job: Job) => <NoxsongizerResultPreview job={job} />,
    [],
  )

  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Upload your tracks"
        description="Songs are separated into high-quality audio stems. Upload one or multiple files."
      >
        {uploadError ? (
          <div className="mb-4">
            <NoticeMessage title="Upload failed" message={uploadError} tone="danger" compact />
          </div>
        ) : null}
        <Uploader
          onUpload={(files) => {
            startUpload(files)
          }}
          busy={isUploading}
        />
      </Section>

      {actionError ? (
        <NoticeMessage title="Action failed" message={actionError} tone="danger" compact />
      ) : null}

      <Section
        title={`Task history (${pagedItems.length} of ${total})`}
        description="Latest tasks for this tool. Click a row to open the preview modal."
        actions={
          <Pagination total={total} pageSize={pageSize} currentPage={page} onPageChange={(p) => setPage(p)} />
        }
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
        renderPreview={renderJobContent}
      />
    </div>
  )
}
