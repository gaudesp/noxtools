import { type Job } from "@/entities/job"

export type JobHistoryStore = {
  pagedItems: Job[]
  total: number
  page: number
  pageSize: number
  setPage: (page: number) => void
  streamError: string | null
  loading: boolean
  deleteJob: (id: string) => Promise<void>
  select: (id: string) => void
}
