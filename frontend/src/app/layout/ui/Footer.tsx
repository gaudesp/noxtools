import { useMemo } from "react"
import type { LayoutJobSummary, LayoutJobStatus } from "@/app/layout/model"

type Props = {
  jobs: LayoutJobSummary[]
  loading?: boolean
}

const TONE: Record<LayoutJobStatus, string> = {
  pending: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  running: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  done: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  error: "border-rose-400/30 bg-rose-500/10 text-rose-100",
}

export default function Footer({ jobs, loading }: Props) {
  const counts = useMemo(() => {
    return jobs.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      },
      { pending: 0, running: 0, done: 0, error: 0 } as Record<LayoutJobStatus, number>,
    )
  }, [jobs])

  const summary = [
    { label: "Pending", value: counts.pending, tone: TONE.pending },
    { label: "Running", value: counts.running, tone: TONE.running },
    { label: "Done", value: counts.done, tone: TONE.done },
    { label: "Errors", value: counts.error, tone: TONE.error },
  ]

  return (
    <div className="sticky bottom-0 z-40 flex flex-wrap items-center gap-3 border-t border-slate-800 bg-slate-900/90 px-4 py-6 text-sm text-slate-200 backdrop-blur">
      <div className="flex flex-wrap gap-2">
        {summary.map((item) => (
          <span
            key={item.label}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${item.tone}`}
          >
            <span className="h-2 w-2 rounded-full bg-white/60" aria-hidden />
            {item.label}: {item.value}
          </span>
        ))}
      </div>

      <span className="ml-auto text-xs text-slate-400">
        {loading ? "Refreshing jobs…" : `Total jobs: ${jobs.length}`}
      </span>
    </div>
  )
}
