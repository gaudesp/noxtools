import { type Job, getNoxelizerDownloadUrl } from "../../lib/api"
import NoticeMessage from "../common/NoticeMessage"

export default function NoxelizerResultPreview({ job }: { job: Job }) {
  if (job.tool !== "noxelizer") return null

  if (job.status === "pending")
    return (
      <NoticeMessage
        message="Job is queued and will start processing soon."
        tone="warning"
      />
    )

  if (job.status === "running")
    return (
      <NoticeMessage message="Job is currently being executed." withSpinner tone="info" />
    )

  if (job.status === "error") {
    return (
      <NoticeMessage
        title="Job failed"
        message="An error occurred while executing the job."
        details={job.error_message}
        tone="danger"
      />
    )
  }

  if (job.status === "done") {
    const filename =
      job.output_files?.[0] ||
      (job.result?.video as string | undefined) ||
      null

    if (!filename) {
      return (
        <NoticeMessage
          title="No video available"
          message="The job completed but no output video was recorded."
          tone="warning"
        />
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
