import { type Job } from "@/lib/api/core"

export interface NoxelizerJobResult {
  video?: string
  frames_written?: number
  fps?: number
  duration?: number
  final_hold?: number
  codec?: string
}

export interface NoxelizerJob extends Job<NoxelizerJobResult> {
  tool: "noxelizer"
  result?: NoxelizerJobResult
}

export interface NoxelizerCreateRequest {
  files: File[]
  fps?: number
  duration?: number
  final_hold?: number
}

export interface NoxelizerCreateResponse {
  job_id: string
}
