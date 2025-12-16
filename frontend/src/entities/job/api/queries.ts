import { API_BASE_URL, handleResponse } from "@/shared/api"
import type { Job } from "../model/types"
import type { ListJobsParams, PaginatedJobs } from "./types"

export async function listJobs(
  params: ListJobsParams = {},
): Promise<PaginatedJobs<Job>> {
  const search = new URLSearchParams()

  if (params.tool) search.set("tool", params.tool)
  if (params.status) search.set("status", params.status)
  if (typeof params.limit === "number") search.set("limit", String(params.limit))
  if (typeof params.offset === "number") search.set("offset", String(params.offset))

  const res = await fetch(`${API_BASE_URL}/jobs?${search.toString()}`)
  return handleResponse<PaginatedJobs<Job>>(res)
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
