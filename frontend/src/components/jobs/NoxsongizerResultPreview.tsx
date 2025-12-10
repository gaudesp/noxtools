import { type Job, getNoxsongizerDownloadUrl } from "../../lib/api"
import ErrorMessage from "../common/ErrorMessage"

type StemType = "vocals" | "other" | "drums" | "bass"

const STEM_ORDER: { type: StemType; label: string }[] = [
  { type: "vocals", label: "Vocals" },
  { type: "other", label: "Other" },
  { type: "bass", label: "Bass" },
  { type: "drums", label: "Drums" },
]

function isStem(stem: string, type: StemType): boolean {
  const lowerStem = stem.toLowerCase()
  return (
    lowerStem === `${type}.wav` ||
    lowerStem.endsWith(`_${type}.wav`) ||
    lowerStem.startsWith(`[${type}] `)
  )
}

export default function NoxsongizerResultPreview({ job }: { job: Job }) {
  if (job.tool !== "noxsongizer") return null

  if (job.status === "pending")
    return <p className="text-sm text-slate-200">Job queued, we will start processing soon.</p>

  if (job.status === "running")
    return <p className="text-sm text-slate-200">Demucs is currently separating your track. Hang tight!</p>

  if (job.status === "error") {
    return (
      <ErrorMessage
        title="Job failed"
        message="The separation could not be completed."
        details={job.error_message}
      />
    )
  }

  if (job.status === "done") {
    const stems = job.output_files || (job.result?.stems as string[] | undefined) || []
    const orderedStems = STEM_ORDER.map((stemInfo) => {
      const match = stems.find((stem) => isStem(stem, stemInfo.type))
      return match ? { ...stemInfo, filename: match } : null
    }).filter(Boolean) as Array<{ type: StemType; label: string; filename: string }>

    if (!orderedStems.length) {
      return (
        <ErrorMessage
          title="No stems available"
          message="The job completed but no stem files were recorded."
          tone="warning"
        />
      )
    }

    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          {orderedStems.map(({ label, filename, type }) => {
            const url = getNoxsongizerDownloadUrl(job.id, filename)
            return (
              <div
                key={type}
                className="border border-slate-800 rounded-lg p-3 bg-slate-900"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold">{label}</span>
                  <a
                    href={url}
                    download
                    className="text-xs px-3 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white transition"
                  >
                    Download
                  </a>
                </div>
                <audio controls className="w-full">
                  <source src={url} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return <p className="text-sm text-slate-200">No details available.</p>
}
