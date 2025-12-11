import { API_BASE_URL, handleResponse, type Job, type PaginatedJobs, type ListJobsParams } from "@/lib/api/core"
import { listJobs } from "@/lib/api/jobs"

export interface NoxelizerUploadItem {
  job_id: string
  filename: string
}

export interface NoxelizerUploadResponse {
  jobs: NoxelizerUploadItem[]
}

export interface NoxelizerJobResult {
  video?: string
  frames_written?: number
  fps?: number
  duration?: number
  final_hold?: number
  codec?: string
}

export interface NoxelizerJob extends Job<NoxelizerJobResult> {
  tool: "noxelizer"
  result?: NoxelizerJobResult
}

export async function uploadNoxelizer(files: File[]): Promise<NoxelizerUploadResponse> {
  const form = new FormData()
  files.forEach((file) => form.append("files", file))

  const res = await fetch(`${API_BASE_URL}/noxelizer/upload`, {
    method: "POST",
    body: form,
  })

  return handleResponse<NoxelizerUploadResponse>(res)
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
