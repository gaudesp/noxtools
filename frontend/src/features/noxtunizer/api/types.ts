import { type Job, type JobResult } from "@/entities/job"

export interface CreateRequest {
  files?: File[]
  file_ids?: string[]
}

export interface CreateResponse {
  jobs: UploadItem[]
}

export interface NoxtunizerSummary {
  bpm?: number | null
  key?: string | null
  duration?: number | null
  duration_label?: string
}

export interface UploadItem {
  job_id: string
  filename?: string
  duplicate_of?: string | null
}

export type NoxtunizerJob = Job<CreateRequest, JobResult<NoxtunizerSummary>>
