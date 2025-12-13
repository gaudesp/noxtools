import { type Job } from "@/entities/job"

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

export type NoxtunizerJob = Job<unknown, NoxtunizerJobResult>

export interface NoxtunizerCreateRequest {
  files: File[]
}
