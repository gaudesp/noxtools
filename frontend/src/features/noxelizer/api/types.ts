import { type Job } from "@/entities/job"

export interface CreateRequest {
  files: File[]
  fps?: number
  duration?: number
  final_hold?: number
}

export interface CreateResponse {
  job_id: string
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
