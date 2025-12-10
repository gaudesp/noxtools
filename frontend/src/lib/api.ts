const API_BASE_URL = "http://localhost:8000/api";

export { API_BASE_URL };

export type JobStatus = "pending" | "running" | "done" | "error";
export type JobTool = "noxsongizer" | "noxelizer" | "noxtubizer" | "noxtunizer";

export interface Job<ResultType = Record<string, unknown>> {
  id: string;
  tool: JobTool;
  status: JobStatus;
  input_filename?: string | null;
  input_path?: string | null;
  output_path?: string | null;
  output_files?: string[] | null;
  params?: Record<string, unknown>;
  result?: ResultType;
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

export interface NoxsongizerUploadItem {
  job_id: string;
  filename: string;
}

export interface NoxsongizerUploadResponse {
  jobs: NoxsongizerUploadItem[];
}

export interface NoxsongizerJobResult {
  stems?: string[];
}

export interface NoxsongizerJob extends Job<NoxsongizerJobResult> {
  tool: "noxsongizer";
}

export interface NoxelizerUploadItem {
  job_id: string;
  filename: string;
}

export interface NoxelizerUploadResponse {
  jobs: NoxelizerUploadItem[];
}

export interface NoxelizerJobResult {
  video?: string;
  frames_written?: number;
  fps?: number;
  duration?: number;
  final_hold?: number;
  codec?: string;
}

export interface NoxelizerJob extends Job<NoxelizerJobResult> {
  tool: "noxelizer";
  result?: NoxelizerJobResult;
}

export interface NoxtunizerUploadItem {
  job_id: string;
  filename: string;
}

export interface NoxtunizerUploadResponse {
  jobs: NoxtunizerUploadItem[];
}

export interface NoxtunizerJobResult {
  bpm: number | null;
  key: string | null;
  duration_seconds: number | null;
  duration_label: string;
}

export interface NoxtunizerJob extends Job<NoxtunizerJobResult> {
  tool: "noxtunizer";
  result?: NoxtunizerJobResult;
}

export interface NoxtubizerJobResult {
  mode?: "audio" | "video" | "both";
  source_title?: string;
  safe_title?: string;
  url?: string;
  audio?: {
    filename: string;
    format: string;
    quality: string;
    real_bitrate?: number;
  };
  video?: {
    filename: string;
    format: string;
    quality: string;
    has_audio: boolean;
    real_height?: number;
  };
  both?: {
    filename: string;
    format: string;
    audio_format: string;
    audio_quality: string;
    has_audio: boolean;
    real_height?: number;
    real_bitrate?: number;
  };
}

export interface NoxtubizerJob extends Job<NoxtubizerJobResult> {
  tool: "noxtubizer";
  result?: NoxtubizerJobResult;
}

export interface NoxtubizerCreateRequest {
  url: string;
  mode: "audio" | "video" | "both";
  audio_quality?: "high" | "320kbps" | "256kbps" | "128kbps" | "64kbps";
  audio_format?: "mp3" | "m4a" | "ogg" | "wav";
  video_quality?: "best" | "4320p" | "2160p" | "1440p" | "1080p" | "720p" | "480p" | "360p" | "240p";
  video_format?: "mp4" | "mkv";
}

export interface NoxtubizerCreateResponse {
  job_id: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

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

export async function uploadNoxsongizer(files: File[]): Promise<NoxsongizerUploadResponse> {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));

  const res = await fetch(`${API_BASE_URL}/noxsongizer/upload`, {
    method: "POST",
    body: form,
  });

  return handleResponse<NoxsongizerUploadResponse>(res);
}

export async function listNoxsongizerJobs(
  params: Omit<ListJobsParams, "tool"> = {}
): Promise<PaginatedJobs> {
  return listJobs({ ...params, tool: "noxsongizer" });
}

export function getNoxsongizerDownloadUrl(jobId: string, stem: string): string {
  return `${API_BASE_URL}/noxsongizer/download/${jobId}/${encodeURIComponent(stem)}`;
}

export function getNoxsongizerSourceUrl(jobId: string): string {
  return `${API_BASE_URL}/noxsongizer/source/${jobId}`;
}

export async function uploadNoxelizer(files: File[]): Promise<NoxelizerUploadResponse> {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));

  const res = await fetch(`${API_BASE_URL}/noxelizer/upload`, {
    method: "POST",
    body: form,
  });

  return handleResponse<NoxelizerUploadResponse>(res);
}

export async function listNoxelizerJobs(
  params: Omit<ListJobsParams, "tool"> = {}
): Promise<PaginatedJobs> {
  return listJobs({ ...params, tool: "noxelizer" });
}

export function getNoxelizerDownloadUrl(jobId: string, filename: string): string {
  return `${API_BASE_URL}/noxelizer/download/${jobId}/${encodeURIComponent(filename)}`;
}

export function getNoxelizerSourceUrl(jobId: string): string {
  return `${API_BASE_URL}/noxelizer/source/${jobId}`;
}

export async function uploadNoxtunizer(files: File[]): Promise<NoxtunizerUploadResponse> {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));

  const res = await fetch(`${API_BASE_URL}/noxtunizer/upload`, {
    method: "POST",
    body: form,
  });

  return handleResponse<NoxtunizerUploadResponse>(res);
}

export async function listNoxtunizerJobs(
  params: Omit<ListJobsParams, "tool"> = {}
): Promise<PaginatedJobs> {
  return listJobs({ ...params, tool: "noxtunizer" });
}

export function getNoxtunizerSourceUrl(jobId: string): string {
  return `${API_BASE_URL}/noxtunizer/source/${jobId}`;
}

export async function createNoxtubizerJob(
  payload: NoxtubizerCreateRequest
): Promise<NoxtubizerCreateResponse> {
  const res = await fetch(`${API_BASE_URL}/noxtubizer/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse<NoxtubizerCreateResponse>(res);
}

export async function listNoxtubizerJobs(
  params: Omit<ListJobsParams, "tool"> = {}
): Promise<PaginatedJobs> {
  return listJobs({ ...params, tool: "noxtubizer" });
}

export function getNoxtubizerDownloadUrl(jobId: string, filename: string): string {
  return `${API_BASE_URL}/noxtubizer/download/${jobId}/${encodeURIComponent(filename)}`;
}
