import { useJobStream } from "@/widgets/job-stream"
import { usePaginatedData } from "@/shared/hooks/usePaginatedData"
import { useSelection } from "@/shared/hooks/useSelection"
import { type Job } from "@/entities/job"

export function useNoxtubizerJobs() {
  const { jobs, loading, error, deleteJob, getJobById } = useJobStream({
    tool: "noxtubizer",
  })

  const { pagedItems, total, page, pageSize, setPage } = usePaginatedData<Job>({
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
