import { API_BASE_URL } from "@/shared/api/config"
import type { Job } from "../model"

export type JobStreamEvent =
  | { type: "job_created"; job: Job }
  | { type: "job_updated"; job: Job }
  | { type: "job_deleted"; job_id: string }

export type JobStreamHandlers = {
  onCreated?: (job: Job) => void
  onUpdated?: (job: Job) => void
  onDeleted?: (jobId: string) => void
  onError?: () => void
}

export function createJobStream(handlers: JobStreamHandlers) {
  const es = new EventSource(`${API_BASE_URL}/jobs/stream`)

  es.addEventListener("job_created", (event) => {
    const data = JSON.parse((event as MessageEvent).data) as JobStreamEvent
    if ("job" in data) handlers.onCreated?.(data.job)
  })

  es.addEventListener("job_updated", (event) => {
    const data = JSON.parse((event as MessageEvent).data) as JobStreamEvent
    if ("job" in data) handlers.onUpdated?.(data.job)
  })

  es.addEventListener("job_deleted", (event) => {
    const data = JSON.parse((event as MessageEvent).data) as JobStreamEvent
    if ("job_id" in data) handlers.onDeleted?.(data.job_id)
  })

  es.onerror = () => {
    handlers.onError?.()
  }

  return {
    close() {
      es.close()
    },
  }
}
