import {
  API_BASE_URL,
  handleResponse,
  type PaginatedJobs,
  type ListJobsParams,
} from "@/lib/api/core"
import { listJobs } from "@/lib/api/jobs"
import {
  type NoxtubizerCreateRequest,
  type NoxtubizerCreateResponse,
} from "./types"

export async function createNoxtubizerJob(
  payload: NoxtubizerCreateRequest,
): Promise<NoxtubizerCreateResponse> {
  const res = await fetch(`${API_BASE_URL}/noxtubizer/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return handleResponse<NoxtubizerCreateResponse>(res)
}

export async function listNoxtubizerJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listJobs({ ...params, tool: "noxtubizer" })
}

export function getNoxtubizerDownloadUrl(jobId: string, filename: string): string {
  return `${API_BASE_URL}/noxtubizer/download/${jobId}/${encodeURIComponent(
    filename,
  )}`
}
