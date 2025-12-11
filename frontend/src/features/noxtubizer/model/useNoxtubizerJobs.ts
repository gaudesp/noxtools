import { useTaskStream } from "@/modules/tasks/useTaskStream"
import { usePaginatedData } from "@/shared/hooks/usePaginatedData"
import { useSelection } from "@/shared/hooks/useSelection"
import { type Job } from "@/features/noxtubizer/api"

export function useNoxtubizerJobs() {
  const { jobs, loading, error, deleteJob, getJobById } = useTaskStream({
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
