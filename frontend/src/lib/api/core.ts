const API_BASE_URL = "http://localhost:8000/api"

export { API_BASE_URL }

export type JobStatus = "pending" | "running" | "done" | "error"
export type JobTool = "noxsongizer" | "noxelizer" | "noxtubizer" | "noxtunizer"

export interface Job<ResultType = Record<string, unknown>> {
  id: string
  tool: JobTool
  status: JobStatus
  input_filename?: string | null
  input_path?: string | null
  output_path?: string | null
  output_files?: string[] | null
  params?: Record<string, unknown>
  result?: ResultType
  error_message?: string | null
  created_at?: string
  updated_at?: string
  started_at?: string | null
  completed_at?: string | null
  locked_at?: string | null
  locked_by?: string | null
  attempt?: number
  max_attempts?: number
}

export interface PaginatedJobs {
  items: Job[]
  total: number
  limit: number
  offset: number
}

export interface ListJobsParams {
  tool?: JobTool
  status?: JobStatus
  limit?: number
  offset?: number
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed with ${res.status}`)
  }
  return res.json() as Promise<T>
}
