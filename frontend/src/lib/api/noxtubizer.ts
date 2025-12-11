import { API_BASE_URL, handleResponse, type Job, type PaginatedJobs, type ListJobsParams } from "@/lib/api/core"
import { listJobs } from "@/lib/api/jobs"

export interface NoxtubizerJobResult {
  mode?: "audio" | "video" | "both"
  source_title?: string
  safe_title?: string
  url?: string
  audio?: {
    filename: string
    format: string
    quality: string
    real_bitrate?: number
  }
  video?: {
    filename: string
    format: string
    quality: string
    has_audio: boolean
    real_height?: number
  }
  both?: {
    filename: string
    format: string
    audio_format: string
    audio_quality: string
    has_audio: boolean
    real_height?: number
    real_bitrate?: number
  }
}

export interface NoxtubizerJob extends Job<NoxtubizerJobResult> {
  tool: "noxtubizer"
  result?: NoxtubizerJobResult
}

export interface NoxtubizerCreateRequest {
  url: string
  mode: "audio" | "video" | "both"
  audio_quality?: "high" | "320kbps" | "256kbps" | "128kbps" | "64kbps"
  audio_format?: "mp3" | "m4a" | "ogg" | "wav"
  video_quality?: "best" | "4320p" | "2160p" | "1440p" | "1080p" | "720p" | "480p" | "360p" | "240p"
  video_format?: "mp4" | "mkv"
}

export interface NoxtubizerCreateResponse {
  job_id: string
}

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
  return `${API_BASE_URL}/noxtubizer/download/${jobId}/${encodeURIComponent(filename)}`
}
