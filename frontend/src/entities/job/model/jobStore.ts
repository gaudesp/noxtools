import { createJobStream, listJobs } from "../api"
import type { ListJobsParams } from "../api/types"
import type { Job, JobTool } from "./types"

type JobsSnapshot = {
  jobsMap: Record<string, Job>
  loading: boolean
  error: string | null
}

type InternalSnapshot = JobsSnapshot & { hasLoaded: boolean }

type JobsListQuery = {
  tool?: JobTool
  limit: number
  offset: number
  cacheKey: string
}

type JobsStore = {
  query: JobsListQuery
  snapshot: InternalSnapshot
  listeners: Set<() => void>
  fetchPromise: Promise<void> | null
}

const stores = new Map<string, JobsStore>()
let streamInitialized = false

const DEFAULT_LIMIT = 200
const DEFAULT_OFFSET = 0
const BACKEND_UNREACHABLE_ERROR = "Backend unreachable."

function makeCacheKey(params: { tool?: JobTool; limit: number; offset: number }): string {
  const toolKey = params.tool ?? "all"
  return `${toolKey}|limit=${params.limit}|offset=${params.offset}`
}

function ensureStore(query: JobsListQuery): JobsStore {
  const existing = stores.get(query.cacheKey)
  if (existing) return existing

  const store: JobsStore = {
    query,
    snapshot: {
      jobsMap: {},
      loading: false,
      error: null,
      hasLoaded: false,
    },
    listeners: new Set(),
    fetchPromise: null,
  }

  stores.set(query.cacheKey, store)
  return store
}

function notify(store: JobsStore) {
  store.listeners.forEach((listener) => listener())
}

function jobBelongsToQuery(query: JobsListQuery, job: Job): boolean {
  return !query.tool || job.tool === query.tool
}

function updateSnapshot(
  store: JobsStore,
  updater: (prev: InternalSnapshot) => InternalSnapshot,
) {
  store.snapshot = updater(store.snapshot)
  notify(store)
}

async function ensureInitialFetch(store: JobsStore) {
  if (store.snapshot.hasLoaded || store.fetchPromise) {
    return store.fetchPromise ?? Promise.resolve()
  }

  updateSnapshot(store, (prev) => ({ ...prev, loading: true }))

  const promise = listJobs({
    tool: store.query.tool,
    limit: store.query.limit,
    offset: store.query.offset,
  })
    .then((res) => {
      const fetchedMap: Record<string, Job> = {}
      res.items.forEach((job) => {
        if (jobBelongsToQuery(store.query, job)) {
          fetchedMap[job.id] = job
        }
      })

      updateSnapshot(store, (prev) => ({
        ...prev,
        jobsMap: { ...fetchedMap, ...prev.jobsMap },
        loading: false,
        error: null,
        hasLoaded: true,
      }))
    })
    .catch(() => {
      updateSnapshot(store, (prev) => ({
        ...prev,
        loading: false,
        error: BACKEND_UNREACHABLE_ERROR,
        hasLoaded: false,
      }))
    })
    .finally(() => {
      store.fetchPromise = null
    })

  store.fetchPromise = promise
  return promise
}

function ensureJobStream() {
  if (streamInitialized) return
  streamInitialized = true

  createJobStream({
    onCreated: handleUpsert,
    onUpdated: handleUpsert,
    onDeleted: handleDelete,
    onError() {
      stores.forEach((store) => {
        updateSnapshot(store, (prev) => ({
          ...prev,
          error: BACKEND_UNREACHABLE_ERROR,
        }))
      })
    },
  })
}

function handleUpsert(job: Job) {
  stores.forEach((store) => {
    if (!jobBelongsToQuery(store.query, job)) return
    updateSnapshot(store, (prev) => ({
      ...prev,
      jobsMap: { ...prev.jobsMap, [job.id]: job },
      error: null,
      hasLoaded: true,
    }))
  })
}

function handleDelete(jobId: string) {
  stores.forEach((store) => {
    if (!store.snapshot.jobsMap[jobId]) return
    const nextMap = { ...store.snapshot.jobsMap }
    delete nextMap[jobId]

    updateSnapshot(store, (prev) => ({
      ...prev,
      jobsMap: nextMap,
      error: null,
    }))
  })
}

export function normalizeJobQuery(params: ListJobsParams = {}): JobsListQuery {
  const limit = params.limit ?? DEFAULT_LIMIT
  const offset = params.offset ?? DEFAULT_OFFSET

  return {
    tool: params.tool,
    limit,
    offset,
    cacheKey: makeCacheKey({ tool: params.tool, limit, offset }),
  }
}

export function subscribeToJobs(query: JobsListQuery, listener: () => void) {
  const store = ensureStore(query)
  ensureJobStream()
  store.listeners.add(listener)
  void ensureInitialFetch(store)

  return () => {
    store.listeners.delete(listener)
  }
}

export function getJobsSnapshot(query: JobsListQuery): JobsSnapshot {
  const store = ensureStore(query)
  return store.snapshot
}

export function removeJobFromCache(jobId: string) {
  handleDelete(jobId)
}

export function upsertJobInCache(job: Job) {
  handleUpsert(job)
}
