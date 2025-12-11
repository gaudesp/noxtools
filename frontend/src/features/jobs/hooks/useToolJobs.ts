import { useEffect, useMemo, useRef, useState } from "react"
import { useNotifications } from "@/shared/notifications";
import { type JobTool } from "@/lib/api/core"
import { useJobStream } from "@/features/jobs/hooks/useJobStream"

type Options = {
  tool: JobTool
  pageSize?: number
}

export function useToolJobs({ tool, pageSize = 10 }: Options) {
  const [page, setPage] = useState(1)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const { notify } = useNotifications()
  const lastErrorRef = useRef<string | null>(null)

  const { jobs: allJobs, loading, error, deleteJob, getJobById } = useJobStream({ tool })

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      notify(error, "danger")
      lastErrorRef.current = error
    }
  }, [error, notify])

  const total = allJobs.length
  const offset = (page - 1) * pageSize

  const pagedJobs = useMemo(() => {
    return allJobs.slice(offset, offset + pageSize)
  }, [allJobs, offset, pageSize])

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(total / pageSize))
    if (page > lastPage) {
      setPage(lastPage)
    }
  }, [page, pageSize, total])

  const selectedJob = useMemo(() => getJobById(selectedJobId), [getJobById, selectedJobId])

  return {
    jobs: allJobs,
    pagedJobs,
    total,
    page,
    pageSize,
    setPage,
    loading,
    error,
    deleteJob,
    selectedJob,
    selectJob: (jobId: string | null) => setSelectedJobId(jobId),
    clearSelection: () => setSelectedJobId(null),
  }
}
