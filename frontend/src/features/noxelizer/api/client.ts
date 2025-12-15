import { API_BASE_URL, handleResponse } from "@/shared/api"
import { type PaginatedJobs, type ListJobsParams, listJobs as listEntityJobs } from "@/entities/job"
import type { CreateRequest, CreateResponse } from "./types"

export async function createJob(
  payload: CreateRequest,
): Promise<CreateResponse> {
  const form = new FormData()

  payload.files.forEach((file) => form.append("files", file))

  if (payload.fps !== undefined) form.append("fps", String(payload.fps))
  if (payload.duration !== undefined) form.append("duration", String(payload.duration))
  if (payload.final_hold !== undefined) form.append("final_hold", String(payload.final_hold))

  const res = await fetch(`${API_BASE_URL}/noxelizer/jobs`, {
    method: "POST",
    body: form,
  })

  return handleResponse<CreateResponse>(res)
}

export async function listToolJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listEntityJobs({ ...params, tool: "noxelizer" })
}

export function getDownloadUrl(jobId: string, filename: string): string {
  return `${API_BASE_URL}/noxelizer/download/${jobId}/${encodeURIComponent(filename)}`
}

export function getSourceUrl(jobId: string): string {
  return `${API_BASE_URL}/noxelizer/source/${jobId}`
}
