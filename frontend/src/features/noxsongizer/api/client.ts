import {
  API_BASE_URL,
  handleResponse,
  type PaginatedJobs,
  type ListJobsParams,
} from "@/lib/api/core"
import { listJobs } from "@/lib/api/jobs"
import {
  type NoxsongizerCreateRequest,
  type NoxsongizerCreateResponse,
} from "./types"

export async function createNoxsongizerJob(
  payload: NoxsongizerCreateRequest,
): Promise<NoxsongizerCreateResponse> {
  const form = new FormData()

  payload.files.forEach((file) => form.append("files", file))

  const res = await fetch(`${API_BASE_URL}/noxsongizer/jobs`, {
    method: "POST",
    body: form,
  })

  return handleResponse<NoxsongizerCreateResponse>(res)
}

export async function listNoxsongizerJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listJobs({ ...params, tool: "noxsongizer" })
}

export function getNoxsongizerDownloadUrl(jobId: string, stem: string): string {
  return `${API_BASE_URL}/noxsongizer/download/${jobId}/${encodeURIComponent(
    stem,
  )}`
}

export function getNoxsongizerSourceUrl(jobId: string): string {
  return `${API_BASE_URL}/noxsongizer/source/${jobId}`
}
