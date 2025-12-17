import { useJobStream, type Job } from "@/entities/job"
import { usePagination, useSelection } from "@/shared/lib"

export function useJobs() {
  const { jobs, loading, error, deleteJob, cancelJob, retryJob, getJobById } = useJobStream({
    tool: "noxelizer",
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
    cancelJob,
    retryJob,
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
