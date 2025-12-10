import { type Job, getNoxelizerDownloadUrl } from "../../lib/api"

export default function NoxelizerResultPreview({ job }: { job: Job }) {
  if (job.tool !== "noxelizer") return null

  if (job.status === "pending")
    return <p className="text-sm text-slate-200">Job queued, we will start processing soon.</p>

  if (job.status === "running")
    return <p className="text-sm text-slate-200">Rendering your depixelization video. Hang tight!</p>

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
    const filename =
      job.output_files?.[0] ||
      (job.result?.video as string | undefined) ||
      null

    if (!filename) {
      return (
        <p className="text-sm text-red-200">
          No output video was recorded for this job.
        </p>
      )
    }

    const url = getNoxelizerDownloadUrl(job.id, filename)
    const frames = job.result?.frames_written
    const fps = job.result?.fps

    return (
      <div className="space-y-3">
        <div className="border border-slate-800 rounded-lg p-3 bg-slate-900 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold truncate">Video</span>
            <a
              href={url}
              download
              className="text-xs px-3 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white transition"
            >
              Download
            </a>
          </div>
          <video
            controls
            className="w-full h-[400px] rounded border border-slate-800 bg-black object-contain"
          >
            <source src={url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="text-xs text-slate-400">
            {typeof frames === "number" && (
              <span className="mr-3">Frames: {frames}</span>
            )}
            {typeof fps === "number" && (
              <span className="mr-3">FPS: {fps}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <p className="text-sm text-slate-200">No details available.</p>
}
