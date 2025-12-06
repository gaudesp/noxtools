const API_BASE_URL = "http://localhost:8000/api"

export { API_BASE_URL };

export type NoxsongizerStatus =
  | "pending"
  | "processing"
  | "done"
  | "error"
  | "unknown"

export interface NoxsongizerUploadResponse {
  job_id: string
  filename: string
}

export interface NoxsongizerStatusResponse {
  job_id: string
  status: NoxsongizerStatus
  stems: string[]
  error?: string | null
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed with ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function uploadNoxsongizer(
  file: File,
): Promise<NoxsongizerUploadResponse> {
  const form = new FormData()
  form.append("file", file)

  const res = await fetch(`${API_BASE_URL}/noxsongizer/upload`, {
    method: "POST",
    body: form,
  })

  return handleResponse<NoxsongizerUploadResponse>(res)
}

export async function getNoxsongizerStatus(
  jobId: string,
): Promise<NoxsongizerStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/noxsongizer/status/${jobId}`)
  return handleResponse<NoxsongizerStatusResponse>(res)
}

export function getNoxsongizerDownloadUrl(jobId: string, stem: string): string {
  return `${API_BASE_URL}/noxsongizer/download/${jobId}/${encodeURIComponent(stem)}`
}
