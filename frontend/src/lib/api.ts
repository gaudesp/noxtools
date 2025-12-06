const API_BASE_URL = "http://localhost:8000/api";

export { API_BASE_URL };

export type JobStatus = "pending" | "running" | "done" | "error";
export type JobTool = "noxsongizer" | "noxelizer";

export interface Job {
  id: string;
  tool: JobTool;
  status: JobStatus;
  input_filename?: string | null;
  input_path?: string | null;
  output_path?: string | null;
  output_files?: string[] | null;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  locked_at?: string | null;
  locked_by?: string | null;
  attempt?: number;
  max_attempts?: number;
}

export interface PaginatedJobs {
  items: Job[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListJobsParams {
  tool?: JobTool;
  status?: JobStatus;
  limit?: number;
  offset?: number;
}

export interface NoxsongizerUploadResponse {
  job_id: string;
  filename: string;
}

export interface NoxsongizerJobResult {
  stems?: string[];
}

export interface NoxsongizerJob extends Job {
  tool: "noxsongizer";
  output_files?: string[] | null;
  result?: NoxsongizerJobResult;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// -----------------------------
// Jobs API (generic)
// -----------------------------
export async function listJobs(params: ListJobsParams = {}): Promise<PaginatedJobs> {
  const search = new URLSearchParams();
  if (params.tool) search.set("tool", params.tool);
  if (params.status) search.set("status", params.status);
  if (typeof params.limit === "number") search.set("limit", String(params.limit));
  if (typeof params.offset === "number") search.set("offset", String(params.offset));

  const res = await fetch(`${API_BASE_URL}/jobs?${search.toString()}`);
  return handleResponse<PaginatedJobs>(res);
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
  return handleResponse<Job>(res);
}

export async function deleteJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to delete job ${jobId}`);
  }
}

// -----------------------------
// Noxsongizer-specific helpers
// -----------------------------
export async function uploadNoxsongizer(file: File): Promise<NoxsongizerUploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}/noxsongizer/upload`, {
    method: "POST",
    body: form,
  });

  return handleResponse<NoxsongizerUploadResponse>(res);
}

export async function listNoxsongizerJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listJobs({ ...params, tool: "noxsongizer" });
}

export function getNoxsongizerDownloadUrl(jobId: string, stem: string): string {
  return `${API_BASE_URL}/noxsongizer/download/${jobId}/${encodeURIComponent(stem)}`;
}
