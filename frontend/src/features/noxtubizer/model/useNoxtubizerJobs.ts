import { useJobStream, type Job } from "@/entities/job"
import { usePagination, useSelection } from "@/shared/lib"

export function useNoxtubizerJobs() {
  const { jobs, loading, error, deleteJob, getJobById } = useJobStream({
    tool: "noxtubizer",
  })

  const { pagedItems, total, page, pageSize, setPage } = usePagination<Job>({
    items: jobs,
    pageSize: 10,
  })

  const { selectedId, selectedItem, select, clear } = useSelection<Job>({
    getItemById: getJobById,
  })

  return {
    jobs,
    loading,
    streamError: error,
    deleteJob,
    pagedItems,
    total,
    page,
    pageSize,
    setPage,
    selectedId,
    selectedItem,
    select,
    clear,
  }
}
