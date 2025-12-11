import { useCallback, useState } from "react"
import { uploadNoxsongizer, type Job } from "../lib/api"
import NoticeMessage from "../components/common/NoticeMessage"
import JobUploader from "../components/jobs/JobUploader"
import NoxsongizerResultPreview from "../components/jobs/NoxsongizerResultPreview"
import { useNotifications } from "../components/notifications/Notifications"
import JobPreviewModal from "../components/tooling/JobPreviewModal"
import { useToolJobs } from "../hooks/useToolJobs"
import JobHistorySection from "../components/tooling/JobHistorySection"
import SectionCard from "../components/tooling/SectionCard"
import ToolPageLayout from "../components/tooling/ToolPageLayout"
import ToolSummaryRow from "../components/tooling/ToolSummaryRow"

export default function Noxsongizer() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { notify } = useNotifications()

  const {
    jobs,
    pagedJobs,
    total,
    page,
    pageSize,
    setPage,
    loading,
    error: streamError,
    deleteJob,
    selectedJob,
    selectJob,
    clearSelection,
  } = useToolJobs({ tool: "noxsongizer" })

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
    <ToolPageLayout
      title="Noxsongizer"
      description="Split a song into separate audio stems (vocals, bass, drums and other)."
      eyebrow="Audio separation"
    >
      <SectionCard
        title="Upload your tracks"
        description="Songs are separated into high-quality audio stems. Upload one or multiple files."
      >
        {uploadError ? (
          <div className="mb-4">
            <NoticeMessage title="Upload failed" message={uploadError} tone="danger" compact />
          </div>
        ) : null}
        <JobUploader
          onUpload={(files) => {
            startUpload(files)
          }}
          busy={isUploading}
        />
      </SectionCard>

      {actionError ? (
        <NoticeMessage title="Action failed" message={actionError} tone="danger" compact />
      ) : null}

      <JobHistorySection
        jobs={pagedJobs}
        total={total}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={(p) => setPage(p)}
        onSelectJob={(job) => {
          selectJob(job.id)
          setPreviewOpen(true)
        }}
        onDeleteJob={async (job) => {
          try {
            setActionError(null)
            await deleteJob(job.id)
            if (selectedJob?.id === job.id) {
              clearSelection()
              setPreviewOpen(false)
            }
            notify("Job deleted.", "success")
          } catch (err) {
            console.error(err)
            setActionError("Failed to delete job.")
          }
        }}
        loading={loading}
        error={streamError}
      />

      <JobPreviewModal
        job={selectedJob}
        open={Boolean(previewOpen && selectedJob)}
        onClose={() => {
          clearSelection()
          setPreviewOpen(false)
        }}
        renderPreview={renderJobContent}
      />

      <ToolSummaryRow jobs={jobs} loading={loading} />
    </ToolPageLayout>
  )
}
