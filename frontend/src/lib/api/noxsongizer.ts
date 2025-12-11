import { API_BASE_URL, handleResponse, type Job, type PaginatedJobs, type ListJobsParams } from "./core"
import { listJobs } from "./jobs"

export interface NoxsongizerUploadItem {
  job_id: string
  filename: string
}

export interface NoxsongizerUploadResponse {
  jobs: NoxsongizerUploadItem[]
}

export interface NoxsongizerJobResult {
  stems?: string[]
}

export interface NoxsongizerJob extends Job<NoxsongizerJobResult> {
  tool: "noxsongizer"
}

export async function uploadNoxsongizer(files: File[]): Promise<NoxsongizerUploadResponse> {
  const form = new FormData()
  files.forEach((file) => form.append("files", file))

  const res = await fetch(`${API_BASE_URL}/noxsongizer/upload`, {
    method: "POST",
    body: form,
  })

  return handleResponse<NoxsongizerUploadResponse>(res)
}

export async function listNoxsongizerJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listJobs({ ...params, tool: "noxsongizer" })
}

export function getNoxsongizerDownloadUrl(jobId: string, stem: string): string {
  return `${API_BASE_URL}/noxsongizer/download/${jobId}/${encodeURIComponent(stem)}`
}

export function getNoxsongizerSourceUrl(jobId: string): string {
  return `${API_BASE_URL}/noxsongizer/source/${jobId}`
}
