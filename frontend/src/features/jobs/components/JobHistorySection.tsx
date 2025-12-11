import { type Job } from "@/lib/api/core"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import { Section } from "@/app/layout"
import JobTable from "@/features/jobs/components/JobTable"

type Props = {
  jobs: Job[]
  total: number
  pageSize: number
  currentPage: number
  onPageChange: (page: number) => void
  onSelectJob?: (job: Job) => void
  onDeleteJob?: (job: Job) => void
  loading?: boolean
  error?: string | null
  title?: string
  description?: string
}

export default function JobHistorySection({
  jobs,
  total,
  pageSize,
  currentPage,
  onPageChange,
  onSelectJob,
  onDeleteJob,
  loading,
  error,
  title,
  description,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1)
  }

  const actions = (
    <div className="flex items-center gap-3 text-xs text-slate-300">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage <= 1}
          className="px-2 py-1 rounded border border-slate-700 disabled:opacity-50 hover:border-violet-500 transition"
        >
          Prev
        </button>
        <span className="text-slate-400">
          Page {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="px-2 py-1 rounded border border-slate-700 disabled:opacity-50 hover:border-violet-500 transition"
        >
          Next
        </button>
      </div>
    </div>
  )

  return (
    <Section
      title={title ?? `Job history (${jobs.length} of ${total})`}
      description={description ?? "Latest jobs for this tool. Click a row to open the preview modal."}
      actions={actions}
      padded={false}
    >
      {error ? (
        <div className="px-5 pt-5 pb-5">
          <NoticeMessage title="Unable to load jobs" message={error} tone="danger" compact />
        </div>
      ) : null}
      <JobTable
        jobs={jobs}
        total={total}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onSelectJob={onSelectJob}
        onDeleteJob={onDeleteJob}
        loading={loading}
        error={null}
        bordered={false}
        showHeader={false}
      />
    </Section>
  )
}
