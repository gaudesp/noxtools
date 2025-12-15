import type { Job } from "@/entities/job"

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
