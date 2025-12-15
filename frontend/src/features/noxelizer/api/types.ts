import { type Job } from "@/entities/job"

export interface NoxelizerJobResult {
  video?: string
  frames_written?: number
  fps?: number
  duration?: number
  final_hold?: number
  codec?: string
}

export type NoxelizerJob = Job<NoxelizerCreateRequest, NoxelizerJobResult>

export interface NoxelizerCreateRequest {
  files: File[]
  fps?: number
  duration?: number
  final_hold?: number
}

export interface NoxelizerCreateResponse {
  job_id: string
}
