import { type Job } from "@/entities/job"

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
}

export interface CreateResponse {
  jobs: UploadItem[]
}

export interface JobResult {
  mode: Mode
  source_title?: string
  safe_title?: string
  url?: string
  audio?: AudioInfo
  video?: VideoInfo
  both?: BothInfo
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

export interface AudioInfo {
  filename: string
  format: string
  quality: string
  real_bitrate?: number
}

export interface VideoInfo {
  filename: string
  format: string
  quality: string
  has_audio: boolean
  real_height?: number
}

export interface BothInfo {
  filename: string
  format: string
  audio_format: string
  audio_quality: string
  has_audio: boolean
  real_height?: number
  real_bitrate?: number
}

export type NoxtubizerJob = Job<CreateRequest, JobResult>
