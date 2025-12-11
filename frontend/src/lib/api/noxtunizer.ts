import { API_BASE_URL, handleResponse, type Job, type PaginatedJobs, type ListJobsParams } from "./core"
import { listJobs } from "./jobs"

export interface NoxtunizerUploadItem {
  job_id: string
  filename: string
}

export interface NoxtunizerUploadResponse {
  jobs: NoxtunizerUploadItem[]
}

export interface NoxtunizerJobResult {
  bpm: number | null
  key: string | null
  duration_seconds: number | null
  duration_label: string
}

export interface NoxtunizerJob extends Job<NoxtunizerJobResult> {
  tool: "noxtunizer"
  result?: NoxtunizerJobResult
}

export async function uploadNoxtunizer(files: File[]): Promise<NoxtunizerUploadResponse> {
  const form = new FormData()
  files.forEach((file) => form.append("files", file))

  const res = await fetch(`${API_BASE_URL}/noxtunizer/upload`, {
    method: "POST",
    body: form,
  })

  return handleResponse<NoxtunizerUploadResponse>(res)
}

export async function listNoxtunizerJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listJobs({ ...params, tool: "noxtunizer" })
}

export function getNoxtunizerSourceUrl(jobId: string): string {
  return `${API_BASE_URL}/noxtunizer/source/${jobId}`
}
