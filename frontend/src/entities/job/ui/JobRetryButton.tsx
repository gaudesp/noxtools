import { useState } from "react"
import type { Job } from "../model/types"
import { useNotifications } from "@/shared/ui"

type Props = {
  job: Job
  onRetry?: (job: Job) => void | Promise<void>
}

export default function JobRetryButton({ job, onRetry }: Props) {
  const [loading, setLoading] = useState(false)
  const { notify } = useNotifications()

  return (
    <button
      type="button"
      aria-disabled={loading}
      onClick={async (e) => {
        e.stopPropagation()
        if (!onRetry || loading) return

        setLoading(true)
        try {
          await onRetry(job)
          notify("Job re-queued for processing.", "success")
        } catch (err) {
          console.error(err)
          notify("Failed to retry job.", "danger")
        } finally {
          setLoading(false)
        }
      }}
      className={`text-xs px-2 py-1 rounded border transition ${
        loading
          ? "cursor-not-allowed border-slate-600 text-slate-400"
          : "border-sky-600 text-sky-100 hover:bg-sky-900/30"
      }`}
    >
      {loading ? "Retrying..." : "Retry"}
    </button>
  )
}
