import { API_BASE_URL, handleResponse } from "@/shared/api"
import { type PaginatedJobs, type ListJobsParams, listJobs as listEntityJobs } from "@/entities/job"
import type { CreateRequest, CreateResponse } from "./types"

export async function createJob(
  payload: CreateRequest,
): Promise<CreateResponse> {
  const res = await fetch(`${API_BASE_URL}/noxtubizer/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  return handleResponse<CreateResponse>(res)
}

export async function listJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listEntityJobs({ ...params, tool: "noxtubizer" })
}

export function getDownloadUrl(jobId: string, filename: string): string {
  return `${API_BASE_URL}/noxtubizer/download/${jobId}/${encodeURIComponent(
    filename,
  )}`
}
