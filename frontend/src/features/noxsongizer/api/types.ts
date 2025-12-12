import { type Job as CoreJob } from "@/lib/api/core"

export interface NoxsongizerJobResult {
  stems?: string[]
}

export interface NoxsongizerJob extends CoreJob<NoxsongizerJobResult> {
  tool: "noxsongizer"
  result?: NoxsongizerJobResult
}

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
