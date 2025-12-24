import { type Job, type JobResult } from "@/entities/job"

export interface CreateRequest {
  files?: File[]
  file_ids?: string[]
}

export interface CreateResponse {
  jobs: UploadItem[]
}

export interface NoxsongizerSummary {
  stems?: string[]
}

export interface UploadItem {
  job_id: string
  filename?: string
  duplicate_of?: string | null
}

export type NoxsongizerJob = Job<CreateRequest, JobResult<NoxsongizerSummary>>
