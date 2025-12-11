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
import NoxelizerResultPreview from "@/features/noxelizer/components/ResultPreview"
import { uploadNoxelizer, type Job } from "@/features/noxelizer/api/api"

export default function NoxelizerPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { notify } = useNotifications()
  const { setHeader, setFooter } = useLayout()
  const { jobs, loading, error: streamError, deleteJob, getJobById } = useTaskStream({ tool: "noxelizer" })
  const { pagedItems, total, page, pageSize, setPage } = usePaginatedData<Job>({ items: jobs, pageSize: 10 })
  const { selectedId, selectedItem, select, clear } = useSelection<Job>({ getItemById: getJobById })

  useEffect(() => {
    setHeader({
      title: "Noxelizer",
      description: "Generate smooth depixelization videos that reveal an image over time.",
      eyebrow: "Image-to-video",
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
      const res = await uploadNoxelizer(files)
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
    (job: Job) => <NoxelizerResultPreview job={job} />,
    [],
  )

  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Upload your images"
        description="Images are animated into a depixelization video. Upload one or multiple files."
      >
        {uploadError ? (
          <div className="mb-4">
            <NoticeMessage title="Upload failed" message={uploadError} tone="danger" compact />
          </div>
        ) : null}
        <Uploader
          onUpload={(files) => startUpload(files)}
          busy={isUploading}
          accept="image/*"
          title="Drag & drop images here"
          description="or click to choose one or multiple images from your computer"
          inputId="noxelizer-uploader-input"
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
