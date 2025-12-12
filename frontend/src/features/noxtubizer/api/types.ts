import { type Job } from "@/entities/job"

export type NoxtubizerMode = "audio" | "video" | "both"

export type NoxtubizerAudioQuality =
  | "high"
  | "320kbps"
  | "256kbps"
  | "128kbps"
  | "64kbps"

export type NoxtubizerAudioFormat = "mp3" | "m4a" | "ogg" | "wav"

export type NoxtubizerVideoQuality =
  | "best"
  | "4320p"
  | "2160p"
  | "1440p"
  | "1080p"
  | "720p"
  | "480p"
  | "360p"
  | "240p"

export type NoxtubizerVideoFormat = "mp4" | "mkv"

export interface NoxtubizerAudioInfo {
  filename: string
  format: string
  quality: string
  real_bitrate?: number
}

export interface NoxtubizerVideoInfo {
  filename: string
  format: string
  quality: string
  has_audio: boolean
  real_height?: number
}

export interface NoxtubizerBothInfo {
  filename: string
  format: string
  audio_format: string
  audio_quality: string
  has_audio: boolean
  real_height?: number
  real_bitrate?: number
}

export interface NoxtubizerJobResult {
  mode?: NoxtubizerMode
  source_title?: string
  safe_title?: string
  url?: string
  audio?: NoxtubizerAudioInfo
  video?: NoxtubizerVideoInfo
  both?: NoxtubizerBothInfo
}

export type NoxtubizerJob = Job<unknown, NoxtubizerJobResult>

export interface NoxtubizerCreateRequest {
  url: string
  mode: NoxtubizerMode
  audio_quality?: NoxtubizerAudioQuality
  audio_format?: NoxtubizerAudioFormat
  video_quality?: NoxtubizerVideoQuality
  video_format?: NoxtubizerVideoFormat
}

export interface NoxtubizerCreateResponse {
  job_id: string
}
