import { type Job } from "@/entities/job"

export interface CreateRequest {
  files: File[]
  fps?: number
  duration?: number
  final_hold?: number
}

export interface UploadItem {
  job_id: string
  filename?: string
}

export interface CreateResponse {
  jobs: UploadItem[]
}

export interface JobResult {
  video?: string
  frames_written?: number
  fps?: number
  duration?: number
  final_hold?: number
  codec?: string
}

export type NoxelizerJob = Job<CreateRequest, JobResult>
