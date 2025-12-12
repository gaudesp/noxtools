import { type Job as CoreJob } from "@/lib/api/core"

export interface NoxtunizerUploadItem {
  job_id: string
  filename: string
}

export interface NoxtunizerUploadResponse {
  jobs: NoxtunizerUploadItem[]
}

export interface NoxtunizerJobResult {
  bpm: number | null
  key: string | null
  duration_seconds: number | null
  duration_label: string
}

export interface NoxtunizerJob extends CoreJob<NoxtunizerJobResult> {
  tool: "noxtunizer"
  result?: NoxtunizerJobResult
}

export interface NoxtunizerCreateRequest {
  files: File[]
}
