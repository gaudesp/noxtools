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

export type JobTableContext = {
  onDeleteJob?: (job: Job) => void
}

export type JobTableProps = {
  jobs: Job[]
  total: number
  pageSize: number
  currentPage: number
  loading?: boolean
  error?: string | null

  onPageChange: (page: number) => void
  onSelectJob?: (job: Job) => void
  onDeleteJob?: (job: Job) => void
}
