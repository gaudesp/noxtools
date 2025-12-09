import { useCallback, useEffect, useRef, useState } from "react"
import { uploadNoxelizer, type Job } from "../lib/api"
import { useJobStream } from "../lib/jobs"
import { useNotifications } from "../components/notifications/Notifications"
import JobDetailsModal from "../components/jobs/JobDetailsModal"
import JobTable from "../components/jobs/JobTable"
import JobUploader from "../components/jobs/JobUploader"
import NoxelizerResultPreview from "../components/jobs/NoxelizerResultPreview"

export default function Noxelizer() {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const { notify } = useNotifications()
  const lastErrorRef = useRef<string | null>(null)

  const pageSize = 10
  const offset = (page - 1) * pageSize

  const { jobs: allJobs, loading, error, deleteJob: deleteJobLive, getJobById } = useJobStream({
    tool: "noxelizer",
  })

  const pagedJobs = allJobs.slice(offset, offset + pageSize)
  const total = allJobs.length
  const selectedJob = getJobById(selectedJobId)

  async function startUpload(files: File[]) {
    try {
      setIsUploading(true)
      const res = await uploadNoxelizer(files)
      const ids = res.jobs.map((j) => j.job_id)
      notify(`Upload successful: ${ids.length} job(s) created.`, "success")
    } catch (err) {
      console.error(err)
      notify("File upload failed.", "danger")
    } finally {
      setIsUploading(false)
    }
  }

  const renderJobContent = useCallback(
    (job: Job) => <NoxelizerResultPreview job={job} />,
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
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Noxelizer</h1>

      <JobUploader
        onUpload={(files) => startUpload(files)}
        busy={isUploading}
        accept="image/*"
        title="Drag & drop images here"
        description="or click to choose one or multiple images from your computer"
        inputId="noxelizer-uploader-input"
      />

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
