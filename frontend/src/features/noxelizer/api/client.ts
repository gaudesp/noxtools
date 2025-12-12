import {
  API_BASE_URL,
  handleResponse,
  type PaginatedJobs,
  type ListJobsParams,
} from "@/lib/api/core"
import { listJobs } from "@/lib/api/jobs"
import {
  type NoxelizerCreateRequest,
  type NoxelizerCreateResponse,
} from "./types"

export async function createNoxelizerJob(
  payload: NoxelizerCreateRequest,
): Promise<NoxelizerCreateResponse> {
  const form = new FormData()

  payload.files.forEach((file) => form.append("files", file))

  if (payload.fps !== undefined) form.append("fps", String(payload.fps))
  if (payload.duration !== undefined) form.append("duration", String(payload.duration))
  if (payload.final_hold !== undefined) form.append("final_hold", String(payload.final_hold))

  const res = await fetch(`${API_BASE_URL}/noxelizer/jobs`, {
    method: "POST",
    body: form,
  })

  return handleResponse<NoxelizerCreateResponse>(res)
}

export async function listNoxelizerJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listJobs({ ...params, tool: "noxelizer" })
}

export function getNoxelizerDownloadUrl(jobId: string, filename: string): string {
  return `${API_BASE_URL}/noxelizer/download/${jobId}/${encodeURIComponent(filename)}`
}

export function getNoxelizerSourceUrl(jobId: string): string {
  return `${API_BASE_URL}/noxelizer/source/${jobId}`
}
