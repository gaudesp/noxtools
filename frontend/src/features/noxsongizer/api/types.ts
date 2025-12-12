import { type Job } from "@/entities/job"

export interface NoxsongizerJobResult {
  stems?: string[]
}

export type NoxsongizerJob = Job<unknown, NoxsongizerJobResult>

export interface NoxsongizerUploadItem {
  job_id: string
  filename: string
}

export interface NoxsongizerCreateRequest {
  files: File[]
}

export interface NoxsongizerCreateResponse {
  jobs: NoxsongizerUploadItem[]
}
