import { type Job, getNoxsongizerDownloadUrl } from "../../lib/api"

const STEM_LABELS: Record<string, string> = {
  "vocals.wav": "Vocals",
  "drums.wav": "Drums",
  "bass.wav": "Bass",
  "other.wav": "Other",
}

export default function NoxsongizerResultPreview({ job }: { job: Job }) {
  if (job.tool !== "noxsongizer") return null

  if (job.status === "pending") {
    return (
      <p className="text-sm text-slate-200">
        Your job is queued and will be processed shortly.
      </p>
    )
  }

  if (job.status === "running") {
    return (
      <p className="text-sm text-slate-200">
        Demucs is currently separating your track. Hang tight!
      </p>
    )
  }

  if (job.status === "error") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-200">The job failed.</p>
        {job.error_message && (
          <pre className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded p-2 whitespace-pre-wrap">
            {job.error_message}
          </pre>
        )}
      </div>
    )
  }

  if (job.status === "done") {
    const stems = job.output_files || (job.result?.stems as string[] | undefined) || []
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-200">
          Job completed. Download or listen to the stems below.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {stems.map((stem) => {
            const label = STEM_LABELS[stem] ?? stem
            const url = getNoxsongizerDownloadUrl(job.id, stem)
            return (
              <div
                key={stem}
                className="border border-slate-800 rounded-lg p-3 bg-slate-900"
              >
                <div className="flex items-center justify-between mb-2">
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
