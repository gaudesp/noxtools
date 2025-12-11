import { useCallback, useEffect, useMemo, useState } from "react"
import NoticeMessage from "../components/common/NoticeMessage"
import NoxelizerResultPreview from "../components/jobs/NoxelizerResultPreview"
import NoxsongizerResultPreview from "../components/jobs/NoxsongizerResultPreview"
import NoxtunizerResultPreview from "../components/jobs/NoxtunizerResultPreview"
import NoxtubizerResultPreview from "../components/jobs/NoxtubizerResultPreview"
import { useNotifications } from "../components/notifications/Notifications"
import JobPreviewModal from "../components/tooling/JobPreviewModal"
import JobHistorySection from "../components/tooling/JobHistorySection"
import ToolPageLayout from "../components/tooling/ToolPageLayout"
import ToolSummaryRow from "../components/tooling/ToolSummaryRow"
import { type Job } from "../lib/api"
import { useJobStream } from "../lib/jobs"

const PAGE_SIZE = 20

export default function AllJobs() {
  const { jobs: allJobs, loading, error, deleteJob, getJobById } = useJobStream()
  const [page, setPage] = useState(1)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const { notify } = useNotifications()

  const totalPages = Math.max(1, Math.ceil(allJobs.length / PAGE_SIZE))
  const offset = (page - 1) * PAGE_SIZE
  const pagedJobs = useMemo(() => allJobs.slice(offset, offset + PAGE_SIZE), [allJobs, offset])

  const selectedJob = useMemo(() => getJobById(selectedJobId), [getJobById, selectedJobId])

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(allJobs.length / PAGE_SIZE))
    if (page > lastPage) {
      setPage(lastPage)
    }
  }, [allJobs.length, page])

  const renderJobContent = useCallback((job: Job) => {
    if (job.tool === "noxsongizer") return <NoxsongizerResultPreview job={job} />
    if (job.tool === "noxelizer") return <NoxelizerResultPreview job={job} />
    if (job.tool === "noxtunizer") return <NoxtunizerResultPreview job={job} />
    if (job.tool === "noxtubizer") return <NoxtubizerResultPreview job={job} />
    return <p className="text-sm text-slate-200">No preview available for this job.</p>
  }, [])

  return (
    <ToolPageLayout
      title="All jobs"
      description={`Overall view of jobs across all tools.`}
      eyebrow="Global overview"
    >
      <JobHistorySection
        jobs={pagedJobs}
        total={allJobs.length}
        pageSize={PAGE_SIZE}
        currentPage={page}
        onPageChange={setPage}
        onSelectJob={(job) => {
          setSelectedJobId(job.id)
          setPreviewOpen(true)
        }}
        onDeleteJob={async (job) => {
          try {
            setActionError(null)
            await deleteJob(job.id)
            if (selectedJob?.id === job.id) {
              setSelectedJobId(null)
              setPreviewOpen(false)
            }
            notify("Job deleted.", "success")
          } catch (err) {
            console.error(err)
            setActionError("Failed to delete job.")
          }
        }}
        loading={loading}
        error={error}
        title={`Job history (${pagedJobs.length} of ${allJobs.length})`}
        description="Latest jobs across all tools. Click a row to open the preview modal."
      />

      {actionError ? (
        <div className="pt-3">
          <NoticeMessage title="Action failed" message={actionError} tone="danger" compact />
        </div>
      ) : null}

      <JobPreviewModal
        job={selectedJob}
        open={Boolean(previewOpen && selectedJob)}
        onClose={() => {
          setSelectedJobId(null)
          setPreviewOpen(false)
        }}
        renderPreview={renderJobContent}
      />

      <ToolSummaryRow jobs={allJobs} loading={loading} />
    </ToolPageLayout>
  )
}
