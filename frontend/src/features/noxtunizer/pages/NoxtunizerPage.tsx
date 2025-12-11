import { useCallback, useState, useEffect } from "react"
import NoticeMessage from "../../../shared/ui/NoticeMessage"
import JobPreviewModal from "../../jobs/components/JobPreviewModal"
import { Section } from "../../../app/layout"
import { useLayout } from "../../../app/layout"
import { useNotifications } from "../../../shared/notifications";
import JobUploader from "../../jobs/components/JobUploader"
import JobHistorySection from "../../jobs/components/JobHistorySection"
import { useToolJobs } from "../../jobs/hooks/useToolJobs"
import NoxtunizerResultPreview from "../components/ResultPreview"
import { uploadNoxtunizer, type Job } from "../api/api"

export default function NoxtunizerPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { notify } = useNotifications()
  const { setHeader, setFooterJobs } = useLayout()

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

  useEffect(() => {
    setHeader({
      title: "Noxtunizer",
      description: "Extract BPM, key and durability from any track.",
      eyebrow: "Musical analysis",
    })

    setFooterJobs(jobs, loading)

    return () => {
      setFooterJobs([], false)
    }
  }, [jobs, loading])

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
    } finally {
      setIsUploading(false)
    }
  }

  const renderJobContent = useCallback(
    (job: Job) => <NoxtunizerResultPreview job={job} />,
    [],
  )

  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Upload your audio"
        description="Audio files are analyzed to extract musical attributes. Upload one or multiple files."
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
          accept="audio/*"
          title="Drag & drop audio here"
          description="or click to choose one or multiple songs from your computer"
          inputId="noxtunizer-uploader-input"
        />
      </Section>

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
    </div>
  )
}
