import { useCallback, useState } from "react"
import { uploadNoxsongizer, type Job } from "../lib/api"
import { useJobStream } from "../lib/jobs"
import JobDetailsModal from "../components/jobs/JobDetailsModal"
import NoxsongizerResultPreview from "../components/jobs/NoxsongizerResultPreview"
import JobTable from "../components/jobs/JobTable"
import JobUploader from "../components/jobs/JobUploader"

export default function Noxsongizer() {
  const [isUploading, setIsUploading] = useState(false)
  const [lastJobIds, setLastJobIds] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)

  const pageSize = 10
  const offset = (page - 1) * pageSize

  const { jobs: allJobs, loading, error, deleteJob: deleteJobLive, getJobById } = useJobStream({
    tool: "noxsongizer",
  })

  const pagedJobs = allJobs.slice(offset, offset + pageSize)
  const total = allJobs.length
  const selectedJob = getJobById(selectedJobId)

  async function startUpload(files: File[]) {
    try {
      setErrorMessage(null)
      setIsUploading(true)
      setLastJobIds([])

      const res = await uploadNoxsongizer(files)
      const ids = res.jobs.map((j) => j.job_id)
      setLastJobIds(ids)
    } catch (err) {
      console.error(err)
      setErrorMessage("File upload failed.")
    } finally {
      setIsUploading(false)
    }
  }

  const renderJobContent = useCallback(
    (job: Job) => <NoxsongizerResultPreview job={job} />,
    [],
  )

  function onCloseModal() {
    setSelectedJobId(null)
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Noxsongizer</h1>

      <JobUploader
        onUpload={(files) => {
          startUpload(files)
        }}
        busy={isUploading}
        errorMessage={errorMessage}
        lastJobIds={lastJobIds}
      />

      <div className="mt-10 space-y-3">
        {error && (
          <div className="text-sm text-rose-200 bg-rose-900/30 border border-rose-800 rounded px-3 py-2">
            {error}
          </div>
        )}
        <JobTable
          jobs={pagedJobs}
          total={total}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={(p) => setPage(p)}
          onSelectJob={(job) => setSelectedJobId(job.id)}
          onDeleteJob={async (job) => {
            try {
              await deleteJobLive(job.id)
            } catch (err) {
              console.error(err)
              setErrorMessage("Failed to delete job.")
            }
          }}
          loading={loading}
          error={null}
        />
      </div>

      <JobDetailsModal
        job={selectedJob}
        open={Boolean(selectedJob)}
        onClose={onCloseModal}
        renderContent={renderJobContent}
      />
    </div>
  )
}
