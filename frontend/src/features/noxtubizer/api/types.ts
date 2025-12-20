import { type Job, type JobResult } from "@/entities/job"

export interface CreateRequest {
  url: string
  mode: Mode
  audio_quality?: AudioQuality
  audio_format?: AudioFormat
  video_quality?: VideoQuality
  video_format?: VideoFormat
}

export interface UploadItem {
  job_id: string
  filename?: string
  duplicate_of?: string | null
}

export interface CreateResponse {
  jobs: UploadItem[]
}

export interface NoxtubizerSummary {
  mode?: Mode
  title?: string
  url?: string
}

export type Mode = "audio" | "video" | "both"

export type AudioQuality =
  | "high"
  | "320kbps"
  | "256kbps"
  | "128kbps"
  | "64kbps"

export type AudioFormat = "mp3" | "m4a" | "ogg" | "wav"

export type VideoQuality =
  | "best"
  | "4320p"
  | "2160p"
  | "1440p"
  | "1080p"
  | "720p"
  | "480p"
  | "360p"
  | "240p"

export type VideoFormat = "mp4" | "mkv"

export type NoxtubizerJob = Job<CreateRequest, JobResult<NoxtubizerSummary>>
