import { JobStatusGate } from "@/entities/job"
import { type NoxtunizerJob } from "../api"

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  return String(value)
}

type Props = { job: NoxtunizerJob }

export default function Result({ job }: Props) {
  return (
    <JobStatusGate
      job={job}
      onDone={() => {
        const summary = job.result?.summary || {
          bpm: null,
          key: null,
          duration_label: "—",
        }

        const blocks = [
          { label: "BPM", value: displayValue(summary.bpm) },
          { label: "KEY", value: displayValue(summary.key) },
          { label: "DURATION", value: displayValue(summary.duration_label) },
        ]

        return (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-center">
              {blocks.map((block) => (
                <div
                  key={block.label}
                  className="border border-slate-800 rounded-lg bg-slate-900 p-3"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                    {block.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-50">
                    {block.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      }}
    />
  )
}
