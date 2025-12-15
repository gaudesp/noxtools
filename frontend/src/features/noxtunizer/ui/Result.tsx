import { type Job } from "@/entities/job"
import { JobStatusGate } from "@/features/job-status"
import { FileBlock, AudioPlayer } from "@/shared/ui"
import { getNoxtunizerSourceUrl, type NoxtunizerJobResult } from "../api"

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  return String(value)
}

type Props = {
  job: Job<unknown, NoxtunizerJobResult>
}

export default function Result({ job }: Props) {
  return (
    <JobStatusGate
      job={job}
      onDone={() => {
        const result = job.result || {
          bpm: null,
          key: null,
          duration_label: "—",
        }

        const sourceUrl = getNoxtunizerSourceUrl(job.id)

        const blocks = [
          { label: "BPM", value: displayValue(result.bpm) },
          { label: "KEY", value: displayValue(result.key) },
          { label: "DURATION", value: displayValue(result.duration_label) },
        ]

        return (
          <div className="space-y-4">
            <FileBlock title="Audio">
              <AudioPlayer url={sourceUrl} />
            </FileBlock>

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
