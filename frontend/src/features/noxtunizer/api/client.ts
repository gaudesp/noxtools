import { type PaginatedJobs, type ListJobsParams, listJobs as listEntityJobs } from "@/entities/job"
import { API_BASE_URL, handleResponse } from "@/shared/api"
import type { CreateRequest, CreateResponse } from "./types"

export async function createJob(
  payload: CreateRequest,
): Promise<CreateResponse> {
  const form = new FormData()
  payload.files.forEach((file) => form.append("files", file))

  const res = await fetch(`${API_BASE_URL}/noxtunizer/jobs`, {
    method: "POST",
    body: form,
  })

  return handleResponse<CreateResponse>(res)
}

export async function listJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listEntityJobs({ ...params, tool: "noxtunizer" })
}

export function getSourceUrl(jobId: string): string {
  return `${API_BASE_URL}/noxtunizer/source/${jobId}`
}
