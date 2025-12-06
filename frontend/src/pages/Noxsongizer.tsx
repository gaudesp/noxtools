import { useCallback, useState } from "react"
import { uploadNoxsongizer, type Job, deleteJob } from "../lib/api"
import { useJob, useJobs } from "../lib/jobs"
import JobDetailsModal from "../components/jobs/JobDetailsModal"
import NoxsongizerResultPreview from "../components/jobs/NoxsongizerResultPreview"
import JobTable from "../components/jobs/JobTable"
import JobUploader from "../components/jobs/JobUploader"

export default function Noxsongizer() {
  const [isUploading, setIsUploading] = useState(false)
  const [lastJobId, setLastJobId] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)

  const pageSize = 10
  const offset = (page - 1) * pageSize

  const { jobs, total, loading, error, refresh } = useJobs({
    tool: "noxsongizer",
    polling: true,
    limit: pageSize,
    offset,
  })

  const { job: selectedJob } = useJob(selectedJobId, { polling: true })

  async function startUpload(file: File) {
    try {
      setErrorMessage(null)
      setIsUploading(true)

      const res = await uploadNoxsongizer(file)
      setLastJobId(res.job_id)
      setFileName(res.filename)
      refresh()
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
        onUpload={(file) => {
          setFileName(file.name)
          startUpload(file)
        }}
        busy={isUploading}
        errorMessage={errorMessage}
        lastJobId={lastJobId}
        fileName={fileName}
      />

      <div className="mt-10 space-y-3">
        {error && (
          <div className="text-sm text-rose-200 bg-rose-900/30 border border-rose-800 rounded px-3 py-2">
            {error}
          </div>
        )}
        <JobTable
          jobs={jobs}
          total={total}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={(p) => setPage(p)}
          onSelectJob={(job) => setSelectedJobId(job.id)}
          onDeleteJob={async (job) => {
            try {
              await deleteJob(job.id)
              refresh()
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
