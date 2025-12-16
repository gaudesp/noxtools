export type JobStatus =
  | "pending"
  | "running"
  | "done"
  | "error"

export type JobTool =
  | "noxsongizer"
  | "noxelizer"
  | "noxtubizer"
  | "noxtunizer"

export interface Job<TParams = unknown, TResult = unknown> {
  id: string
  tool: JobTool
  status: JobStatus

  input_filename?: string | null
  input_path?: string | null

  output_path?: string | null
  output_files?: string[] | null

  params?: TParams
  result?: TResult

  error_message?: string | null

  created_at: string
  updated_at?: string | null
  started_at?: string | null
  completed_at?: string | null

  locked_at?: string | null
  locked_by?: string | null

  attempt?: number
  max_attempts?: number
}
