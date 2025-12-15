import { useEffect, useMemo, useRef, useState } from "react"
import { type Job, type JobTool } from "."
import { listJobs, deleteJob, createJobStream } from "../api"

type UseJobStreamParams = {
  tool?: JobTool
}

export default function useJobStream({ tool }: UseJobStreamParams = {}) {
  const [jobsMap, setJobsMap] = useState<Record<string, Job>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializedRef = useRef<string | null>(null)

  useEffect(() => {
    if (initializedRef.current === tool) return
    initializedRef.current = tool ?? "__all__"

    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const res = await listJobs({ tool, limit: 200, offset: 0 })
        if (cancelled) return

        const map: Record<string, Job> = {}
        res.items.forEach((job) => {
          map[job.id] = job
        })
        setJobsMap(map)
        setError(null)
      } catch {
        if (!cancelled) setError("Backend unreachable.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
      initializedRef.current = null
    }
  }, [tool])

  useEffect(() => {
    const stream = createJobStream({
      onCreated(job) {
        if (tool && job.tool !== tool) return
        setJobsMap((prev) => ({ ...prev, [job.id]: job }))
      },
      onUpdated(job) {
        if (tool && job.tool !== tool) return
        setJobsMap((prev) => ({ ...prev, [job.id]: job }))
      },
      onDeleted(jobId) {
        setJobsMap((prev) => {
          const next = { ...prev }
          delete next[jobId]
          return next
        })
      },
      onError() {
        setError("Backend unreachable.")
      },
    })

    return () => {
      stream.close()
    }
  }, [tool])

  const jobs = useMemo(() => {
    return Object.values(jobsMap).sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    )
  }, [jobsMap])

  function getJobById(id: string | null): Job | null {
    if (!id) return null
    return jobsMap[id] ?? null
  }

  async function removeJob(jobId: string) {
    await deleteJob(jobId)
  }

  return {
    jobs,
    total: jobs.length,
    loading,
    error,
    deleteJob: removeJob,
    getJobById,
  }
}
