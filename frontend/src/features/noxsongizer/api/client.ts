import { API_BASE_URL, handleResponse } from "@/shared/api"
import { type PaginatedJobs, type ListJobsParams, listJobs as listEntityJobs } from "@/entities/job"
import type { CreateRequest, CreateResponse } from "./types"

export async function createJob(
  payload: CreateRequest,
): Promise<CreateResponse> {
  const form = new FormData()

  payload.files?.forEach((file) => form.append("files", file))
  payload.file_ids?.forEach((fileId) => form.append("file_ids", fileId))

  const res = await fetch(`${API_BASE_URL}/noxsongizer/jobs`, {
    method: "POST",
    body: form,
  })

  return handleResponse<CreateResponse>(res)
}

export async function listJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listEntityJobs({ ...params, tool: "noxsongizer" })
}

export function getDownloadUrl(jobId: string, stem: string): string {
  return `${API_BASE_URL}/noxsongizer/download/${jobId}/${encodeURIComponent(
    stem,
  )}`
}

export function getSourceUrl(jobId: string): string {
  return `${API_BASE_URL}/noxsongizer/source/${jobId}`
}
