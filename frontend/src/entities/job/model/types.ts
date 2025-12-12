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

  params?: TParams
  result?: TResult
  error?: string | null

  created_at: string
  started_at?: string | null
  completed_at?: string | null
}
