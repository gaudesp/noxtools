import {
  API_BASE_URL,
  handleResponse,
  type Job,
  type JobTool,
  type JobStatus,
  type PaginatedJobs,
  type ListJobsParams,
} from "@/lib/api/core"

export async function listJobs(params: ListJobsParams = {}): Promise<PaginatedJobs> {
  const search = new URLSearchParams()
  if (params.tool) search.set("tool", params.tool)
  if (params.status) search.set("status", params.status)
  if (typeof params.limit === "number") search.set("limit", String(params.limit))
  if (typeof params.offset === "number") search.set("offset", String(params.offset))

  const res = await fetch(`${API_BASE_URL}/jobs?${search.toString()}`)
  return handleResponse<PaginatedJobs>(res)
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`)
  return handleResponse<Job>(res)
}

export async function deleteJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, { method: "DELETE" })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to delete job ${jobId}`)
  }
}

export type {
  Job,
  JobTool,
  JobStatus,
  PaginatedJobs,
  ListJobsParams,
}
