import { useCallback, useEffect, useMemo, useState } from "react"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import JobPreviewModal from "@/features/jobs/components/JobPreviewModal"
import { useLayout } from "@/app/layout"
import NoxelizerResultPreview from "@/features/noxelizer/components/ResultPreview"
import NoxsongizerResultPreview from "@/features/noxsongizer/components/ResultPreview"
import NoxtunizerResultPreview from "@/features/noxtunizer/components/ResultPreview"
import NoxtubizerResultPreview from "@/features/noxtubizer/components/ResultPreview"
import { useNotifications } from "@/shared/notifications";
import { type Job } from "@/lib/api/core"
import JobHistorySection from "@/features/jobs/components/JobHistorySection"
import { useJobStream } from "@/features/jobs/hooks/useJobStream"

const PAGE_SIZE = 20

export default function AllJobsPage() {
  const { jobs: allJobs, loading, error, deleteJob, getJobById } = useJobStream()
  const [page, setPage] = useState(1)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const { notify } = useNotifications()
  const { setHeader, setFooterJobs } = useLayout()

  const offset = (page - 1) * PAGE_SIZE
  const pagedJobs = useMemo(() => allJobs.slice(offset, offset + PAGE_SIZE), [allJobs, offset])
  const selectedJob = useMemo(() => getJobById(selectedJobId), [getJobById, selectedJobId])

  useEffect(() => {
    setHeader({
      title: "All jobs",
      description: "Overall view of jobs across all tools.",
      eyebrow: "Global overview",
    })

    setFooterJobs(allJobs, loading)

    return () => {
      setFooterJobs([], false)
    }
  }, [allJobs, loading])

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
    <div className="flex flex-col gap-8">

      <JobHistorySection
        title={`Job history (${pagedJobs.length} of ${allJobs.length})`}
        description="Latest jobs across all tools. Click a row to open the preview modal."
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
    </div>
  )
}
