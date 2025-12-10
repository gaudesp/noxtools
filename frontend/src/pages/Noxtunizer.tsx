import { useCallback, useState } from "react"
import { uploadNoxtunizer, type Job } from "../lib/api"
import ErrorMessage from "../components/common/ErrorMessage"
import JobUploader from "../components/jobs/JobUploader"
import NoxtunizerResultPreview from "../components/jobs/NoxtunizerResultPreview"
import { useNotifications } from "../components/notifications/Notifications"
import JobPreviewModal from "../components/tooling/JobPreviewModal"
import { useToolJobs } from "../hooks/useToolJobs"
import JobHistorySection from "../components/tooling/JobHistorySection"
import SectionCard from "../components/tooling/SectionCard"
import ToolPageLayout from "../components/tooling/ToolPageLayout"
import ToolSummaryRow from "../components/tooling/ToolSummaryRow"

export default function Noxtunizer() {
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
  } = useToolJobs({ tool: "noxtunizer" })

  async function startUpload(files: File[]) {
    try {
      setIsUploading(true)
      setUploadError(null)
      setActionError(null)
      const res = await uploadNoxtunizer(files)
      const ids = res.jobs.map((j) => j.job_id)
      notify(`${ids.length} job(s) created.`, "success")
    } catch (err) {
      console.error(err)
      setUploadError("File upload failed. Please retry.")
      notify("File upload failed.", "danger")
    } finally {
      setIsUploading(false)
    }
  }

  const renderJobContent = useCallback(
    (job: Job) => <NoxtunizerResultPreview job={job} />,
    [],
  )

  return (
    <ToolPageLayout
      title="Noxtunizer"
      description="Extract BPM, key, genre, mood, and danceability from any track."
      eyebrow="Musical analysis"
    >
      <SectionCard
        title="Upload your audio"
        description="Drop one or more audio files. Each will be analyzed and reduced to the most confident musical attributes."
      >
        {uploadError ? (
          <div className="mb-4">
            <ErrorMessage title="Upload failed" message={uploadError} compact />
          </div>
        ) : null}
        <JobUploader
          onUpload={(files) => {
            startUpload(files)
          }}
          busy={isUploading}
          accept="audio/*"
          title="Drag & drop audio here"
          description="or click to choose one or multiple songs from your computer"
          inputId="noxtunizer-uploader-input"
        />
      </SectionCard>

      {actionError ? (
        <ErrorMessage title="Action failed" message={actionError} compact />
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
            notify("Failed to delete job.", "danger")
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
