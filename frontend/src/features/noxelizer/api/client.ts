import { API_BASE_URL, handleResponse } from "@/shared/api"
import { type PaginatedJobs, type ListJobsParams, listJobs as listEntityJobs } from "@/entities/job"
import type { CreateRequest, CreateResponse } from "./types"

export async function createJob(
  payload: CreateRequest,
): Promise<CreateResponse> {
  const form = new FormData()

  payload.files?.forEach((file) => form.append("files", file))
  payload.file_ids?.forEach((fileId) => form.append("file_ids", fileId))

  if (payload.fps !== undefined) form.append("fps", String(payload.fps))
  if (payload.duration !== undefined) form.append("duration", String(payload.duration))
  if (payload.final_hold !== undefined) form.append("final_hold", String(payload.final_hold))

  const res = await fetch(`${API_BASE_URL}/noxelizer/jobs`, {
    method: "POST",
    body: form,
  })

  return handleResponse<CreateResponse>(res)
}

export async function listJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listEntityJobs({ ...params, tool: "noxelizer" })
}

export function getDownloadUrl(jobId: string, filename: string): string {
  return `${API_BASE_URL}/noxelizer/download/${jobId}/${encodeURIComponent(filename)}`
}

type SourceVariant = "thumb"

export function getSourceUrl(
  jobId: string,
  opts: { variant?: SourceVariant } = {},
): string {
  const url = new URL(`${API_BASE_URL}/noxelizer/source/${jobId}`)
  if (opts.variant) url.searchParams.set("variant", opts.variant)
  return url.toString()
}
