import type { Job, JobStatus, JobTool } from "../model"

export interface PaginatedJobs<T = Job> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface ListJobsParams {
  tool?: JobTool
  status?: JobStatus
  limit?: number
  offset?: number
}
