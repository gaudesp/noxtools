import { useEffect } from "react"
import { type Job } from "@/lib/api/core"
import Dates from "@/features/jobs/components/JobPreviewModal/Dates"
import Footer from "@/features/jobs/components/JobPreviewModal/Footer"
import Header from "@/features/jobs/components/JobPreviewModal/Header"

type Props = {
  job: Job | null
  open: boolean
  onClose: () => void
  renderPreview: (job: Job) => React.ReactNode
}

export default function JobPreviewModal({ job, open, onClose, renderPreview }: Props) {
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open || !job) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <Header job={job} onClose={onClose} />

        <div className="px-5 py-4">
          <Dates job={job} />

          <div className="mt-6">
            {renderPreview(job)}
          </div>
        </div>

        <Footer job={job} onClose={onClose} />
      </div>
    </div>
  )
}
