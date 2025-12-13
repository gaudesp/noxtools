type Props = {
  total: number
  pageSize: number
  currentPage: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({ total, pageSize, currentPage, onPageChange, className = "" }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1)
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-slate-300 ${className}`}>
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
  )
}
