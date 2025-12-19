import { type Job } from "@/entities/job"

export interface CreateRequest {
  files: File[]
}

export interface CreateResponse {
  jobs: UploadItem[]
}

export interface JobResult {
  bpm: number | null
  key: string | null
  duration_seconds: number | null
  duration_label: string
}

export interface UploadItem {
  job_id: string
  filename?: string
}

export type NoxtunizerJob = Job<CreateRequest, JobResult>
