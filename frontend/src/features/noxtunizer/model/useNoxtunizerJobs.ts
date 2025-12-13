import { useJobStream } from "@/widgets/job-stream"
import { usePagination, useSelection } from "@/shared/lib"
import { type Job } from "@/entities/job"

export function useNoxtunizerJobs() {
  const { jobs, loading, error, deleteJob, getJobById } = useJobStream({
    tool: "noxtunizer",
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
