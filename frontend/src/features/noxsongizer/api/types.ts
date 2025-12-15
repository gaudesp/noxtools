import { type Job } from "@/entities/job"

export interface CreateRequest {
  files: File[]
}

export interface CreateResponse {
  jobs: UploadItem[]
}

export interface JobResult {
  stems?: string[]
}

export interface UploadItem {
  job_id: string
  filename: string
}

export type NoxsongizerJob = Job<CreateRequest, JobResult>
