import { useCallback, useEffect, useMemo, useState } from "react"
import ErrorMessage from "../components/common/ErrorMessage"
import JobTable from "../components/jobs/JobTable"
import NoxelizerResultPreview from "../components/jobs/NoxelizerResultPreview"
import NoxsongizerResultPreview from "../components/jobs/NoxsongizerResultPreview"
import NoxtubizerResultPreview from "../components/jobs/NoxtubizerResultPreview"
import { useNotifications } from "../components/notifications/Notifications"
import JobPreviewModal from "../components/tooling/JobPreviewModal"
import SectionCard from "../components/tooling/SectionCard"
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
    if (job.tool === "noxtubizer") return <NoxtubizerResultPreview job={job} />
    return <p className="text-sm text-slate-200">No preview available for this job.</p>
  }, [])

  const actions = (
    <div className="flex items-center gap-3 text-xs text-slate-300">
      <div className="text-slate-400">Page {page} / {totalPages}</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-2 py-1 rounded border border-slate-700 disabled:opacity-50 hover:border-violet-500 transition"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-2 py-1 rounded border border-slate-700 disabled:opacity-50 hover:border-violet-500 transition"
        >
          Next
        </button>
      </div>
    </div>
  )

  return (
    <ToolPageLayout
      title="All jobs"
      description={`Overall view of jobs across all tools.`}
      eyebrow="Global overview"
    >
      <SectionCard
        title={`Job history (${pagedJobs.length} of ${allJobs.length})`}
        description="Latest jobs across all tools. Click a row to open the preview modal."
        actions={actions}
        padded={false}
      >
        {error ? (
          <div className="px-5 pt-5">
            <ErrorMessage title="Unable to load jobs" message={error} compact />
          </div>
        ) : null}

        {actionError ? (
          <div className="px-5 pt-3">
            <ErrorMessage title="Action failed" message={actionError} compact />
          </div>
        ) : null}

        <JobTable
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
              notify("Failed to delete job.", "danger")
            }
          }}
          loading={loading}
          error={null}
          showHeader={false}
          bordered={false}
        />
      </SectionCard>

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
