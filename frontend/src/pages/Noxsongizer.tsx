import { useCallback, useEffect, useRef, useState } from "react"
import { uploadNoxsongizer, type Job } from "../lib/api"
import { useJobStream } from "../lib/jobs"
import { useNotifications } from "../components/notifications/Notifications"
import JobDetailsModal from "../components/jobs/JobDetailsModal"
import NoxsongizerResultPreview from "../components/jobs/NoxsongizerResultPreview"
import JobTable from "../components/jobs/JobTable"
import JobUploader from "../components/jobs/JobUploader"

export default function Noxsongizer() {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const { notify } = useNotifications()
  const lastErrorRef = useRef<string | null>(null)

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
      setIsUploading(true)
      const res = await uploadNoxsongizer(files)
      const ids = res.jobs.map((j) => j.job_id)
      notify(`${ids.length} job(s) created.`, "success")
    } catch (err) {
      console.error(err)
      notify("File upload failed.", "danger")
    } finally {
      setIsUploading(false)
    }
  }

  const renderJobContent = useCallback(
    (job: Job) => <NoxsongizerResultPreview job={job} />,
    [],
  )

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      notify(error, "danger")
      lastErrorRef.current = error
    }
  }, [error, notify])

  function onCloseModal() {
    setSelectedJobId(null)
  }

  return (
    <div className="p-6 text-white space-y-8">
      <h1 className="text-2xl font-bold mb-2">Noxsongizer</h1>
      <p className="text-sm text-slate-400">
        Split a song into separate audio stems (vocals, bass, drums and other).
      </p>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Files</label>
            <JobUploader
              onUpload={(files) => {
                startUpload(files)
              }}
              busy={isUploading}
            />
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-3">
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
              notify("Job deleted.", "success")
            } catch (err) {
              console.error(err)
              notify("Failed to delete job.", "danger")
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
