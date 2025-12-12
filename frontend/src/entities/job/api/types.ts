import { type Job, type JobStatus, type JobTool } from "@/entities/job/model"

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
