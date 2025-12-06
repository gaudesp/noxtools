import { useCallback, useEffect, useRef, useState } from "react"
import {
  getJob,
  listJobs,
  type Job,
  type JobStatus,
  type JobTool,
  type PaginatedJobs,
} from "./api"

const POLL_MS = 2000

type UseJobsParams = {
  tool?: JobTool
  status?: JobStatus
  limit?: number
  offset?: number
  polling?: boolean
}

type UseJobsResult = {
  jobs: Job[]
  total: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useJobs(params: UseJobsParams = {}): UseJobsResult {
  const { tool, status, limit = 200, offset = 0, polling = true } = params
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initialLoadRef = useRef<boolean>(true)

  const fetchJobs = useCallback(
    async (showLoading: boolean = false) => {
      if (showLoading || initialLoadRef.current) {
        setLoading(true)
      }
      setError(null)
      try {
        const res: PaginatedJobs = await listJobs({ tool, status, limit, offset })
        setJobs(res.items)
        setTotal(res.total)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "Failed to load jobs")
      } finally {
        setLoading(false)
        initialLoadRef.current = false
      }
    },
    [tool, status, limit, offset],
  )

  useEffect(() => {
    fetchJobs(true)
  }, [fetchJobs])

  useEffect(() => {
    if (!polling) return
    timerRef.current = setInterval(() => fetchJobs(false), POLL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchJobs, polling])

  return {
    jobs,
    total,
    loading,
    error,
    refresh: () => fetchJobs(true),
  }
}

type UseJobResult = {
  job: Job | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

type UseJobOptions = {
  polling?: boolean
}

export function useJob(jobId: string | null, options: UseJobOptions = {}): UseJobResult {
  const { polling = true } = options
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initialLoadRef = useRef<boolean>(true)

  const refresh = useCallback(
    async (showLoading: boolean = false) => {
      if (!jobId) return
      if (showLoading || initialLoadRef.current) {
        setLoading(true)
      }
      setError(null)
      try {
        const res = await getJob(jobId)
        setJob(res)
        if (res.status === "done" || res.status === "error") {
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "Failed to load job")
      } finally {
        setLoading(false)
        initialLoadRef.current = false
      }
    },
    [jobId],
  )

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      return
    }
    refresh(true)
  }, [jobId, refresh])

  useEffect(() => {
    if (!polling || !jobId) return
    timerRef.current = setInterval(() => refresh(false), POLL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [polling, jobId, refresh])

  return {
    job,
    loading,
    error,
    refresh: () => refresh(true),
  }
}
