import NoticeMessage from "@/shared/ui/NoticeMessage"
import { type Job, getNoxelizerDownloadUrl } from "@/features/noxelizer/api/api"
import VideoPlayer from "@/shared/ui/VideoPlayer"

export default function ResultPreview({ job }: { job: Job }) {
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
          <VideoPlayer url={url} filename={filename} height={400} />
        </div>
      </div>
    )
  }

  return <p className="text-sm text-slate-200">No details available.</p>
}
