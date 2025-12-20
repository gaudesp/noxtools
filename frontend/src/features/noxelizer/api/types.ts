import { type Job, type JobResult } from "@/entities/job"

export interface CreateRequest {
  files?: File[]
  file_ids?: string[]
  fps?: number
  duration?: number
  final_hold?: number
}

export interface UploadItem {
  job_id: string
  filename?: string
  duplicate_of?: string | null
}

export interface CreateResponse {
  jobs: UploadItem[]
}

export interface NoxelizerSummary {
  frames?: number
  fps?: number
  duration?: number
  hold?: number
  codec?: string
}

export type NoxelizerJob = Job<CreateRequest, JobResult<NoxelizerSummary>>
