import { useCallback, useMemo, useSyncExternalStore } from "react"
import { deleteJob } from "../api"
import {
  getJobsSnapshot,
  normalizeJobQuery,
  removeJobFromCache,
  subscribeToJobs,
} from "./jobStore"
import { type Job, type JobTool } from "./types"

type UseJobStreamParams = {
  tool?: JobTool
  limit?: number
  offset?: number
}

export default function useJobStream(params: UseJobStreamParams = {}) {
  const query = useMemo(
    () => normalizeJobQuery(params),
    [params.limit, params.offset, params.tool],
  )

  const snapshot = useSyncExternalStore(
    useCallback((listener) => subscribeToJobs(query, listener), [query]),
    useCallback(() => getJobsSnapshot(query), [query]),
    useCallback(() => getJobsSnapshot(query), [query]),
  )

  const jobs = useMemo(() => {
    return Object.values(snapshot.jobsMap).sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    )
  }, [snapshot.jobsMap])

  const getJobById = useCallback(
    (id: string | null): Job | null => {
      if (!id) return null
      return snapshot.jobsMap[id] ?? null
    },
    [snapshot.jobsMap],
  )

  const removeJob = useCallback(async (jobId: string) => {
    await deleteJob(jobId)
    removeJobFromCache(jobId)
  }, [])

  return {
    jobs,
    total: jobs.length,
    loading: snapshot.loading,
    error: snapshot.error,
    deleteJob: removeJob,
    getJobById,
  }
}
