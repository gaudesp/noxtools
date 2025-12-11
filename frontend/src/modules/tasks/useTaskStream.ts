import { useEffect, useMemo, useRef, useState } from "react"
import { API_BASE_URL, type Job, type JobTool } from "@/lib/api/core"
import { deleteJob as deleteJobApi, listJobs } from "@/lib/api/jobs"

type UseTaskStreamParams = {
  tool?: JobTool
}

type UseTaskStreamResult = {
  jobs: Job[]
  total: number
  loading: boolean
  error: string | null
  deleteJob: (jobId: string) => Promise<void>
  getJobById: (id: string | null) => Job | null
}

export function useTaskStream(params: UseTaskStreamParams = {}): UseTaskStreamResult {
  const { tool } = params
  const [jobsMap, setJobsMap] = useState<Record<string, Job>>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const initialLoadedRef = useRef<string | null>(null)
  const loadCompleteRef = useRef<boolean>(false)
  const backendDownRef = useRef<boolean>(false)

  useEffect(() => {
    if (initialLoadedRef.current === tool) return
    initialLoadedRef.current = tool ?? "__all__"
    let cancelled = false

    async function loadInitial() {
      setLoading(true)
      setError(null)
      try {
        const res = await listJobs({ tool, limit: 200, offset: 0 })
        if (cancelled) return
        const next: Record<string, Job> = {}
        res.items.forEach((job) => {
          next[job.id] = job
        })
        setJobsMap(next)
        loadCompleteRef.current = true
        setError(null)
        backendDownRef.current = false
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          if (!backendDownRef.current) {
            setError("Backend unreachable.")
            backendDownRef.current = true
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadInitial()
    return () => {
      cancelled = true
      if (!loadCompleteRef.current) {
        initialLoadedRef.current = null
      }
    }
  }, [tool])

  useEffect(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    const es = new EventSource(`${API_BASE_URL}/jobs/stream`)
    eventSourceRef.current = es

    es.addEventListener("job_created", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as { job: Job }
        if (tool && data.job.tool !== tool) return
        setJobsMap((prev) => ({ ...prev, [data.job.id]: data.job }))
        backendDownRef.current = false
        setError(null)
      } catch (err) {
        console.error("Failed to parse job_created event", err)
      }
    })

    es.addEventListener("job_updated", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as { job: Job }
        if (tool && data.job.tool !== tool) return
        setJobsMap((prev) => ({ ...prev, [data.job.id]: data.job }))
        backendDownRef.current = false
        setError(null)
      } catch (err) {
        console.error("Failed to parse job_updated event", err)
      }
    })

    es.addEventListener("job_deleted", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as { job_id: string }
        setJobsMap((prev) => {
          const next = { ...prev }
          delete next[data.job_id]
          return next
        })
        backendDownRef.current = false
        setError(null)
      } catch (err) {
        console.error("Failed to parse job_deleted event", err)
      }
    })

    es.onerror = (err) => {
      console.error("SSE connection error", err)
      if (!backendDownRef.current) {
        setError("Backend unreachable.")
        backendDownRef.current = true
      }
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [tool])

  const jobs = useMemo(() => {
    const list = Object.values(jobsMap)
    return list.sort((a, b) => {
      const aDate = a.created_at || ""
      const bDate = b.created_at || ""
      return bDate.localeCompare(aDate)
    })
  }, [jobsMap])

  async function deleteJob(jobId: string) {
    await deleteJobApi(jobId)
  }

  const getJobById = (id: string | null) => {
    if (!id) return null
    return jobsMap[id] ?? null
  }

  return {
    jobs,
    total: jobs.length,
    loading,
    error,
    deleteJob,
    getJobById,
  }
}
