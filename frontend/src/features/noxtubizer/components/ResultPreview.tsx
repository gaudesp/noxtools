import { type ReactNode } from "react"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import {
  getNoxtubizerDownloadUrl,
  type Job,
  type NoxtubizerJobResult,
} from "@/features/noxtubizer/api/api"
import AudioPlayer from "@/shared/ui/AudioPlayer"
import VideoPlayer from "@/shared/ui/VideoPlayer"

function AssetBlock({
  title,
  downloadUrl,
  children,
}: {
  title: string
  filename: string | null
  downloadUrl: string
  children: ReactNode
}) {
  return (
    <div className="border border-slate-800 rounded-lg p-3 bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
        </div>
        <a
          href={downloadUrl}
          download
          className="text-xs px-3 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white transition"
        >
          Download
        </a>
      </div>

      {children}
    </div>
  )
}

export default function ResultPreview({ job }: { job: Job }) {
  if (job.tool !== "noxtubizer") return null

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

  const result = (job.result as NoxtubizerJobResult | undefined) || {}
  const mode = ((job.params?.mode as string) || result.mode || "audio").toLowerCase()

  const audio = result.audio
  const video = result.video
  const both = result.both

  const audioFile = audio?.filename ?? null
  const videoFile = video?.filename ?? null
  const finalFile = both?.filename ?? null

  const audioUrl = audioFile ? getNoxtubizerDownloadUrl(job.id, audioFile) : null
  const videoUrl = videoFile ? getNoxtubizerDownloadUrl(job.id, videoFile) : null
  const finalUrl = finalFile ? getNoxtubizerDownloadUrl(job.id, finalFile) : null

  return (
    <div className="space-y-3">
      {mode === "both" && finalUrl && finalFile && (
        <AssetBlock title="Audio + Video" filename={finalFile} downloadUrl={finalUrl}>
          <VideoPlayer
            url={finalUrl}
            filename={finalFile}
            height={400}
            hasAudio={true}
          />
        </AssetBlock>
      )}

      {mode === "video" && videoUrl && videoFile && (
        <AssetBlock title="Video" filename={videoFile} downloadUrl={videoUrl}>
          <VideoPlayer
            url={videoUrl}
            filename={videoFile}
            height={400}
            hasAudio={false}
          />
        </AssetBlock>
      )}

      {mode === "audio" && audioUrl && audioFile && (
        <AssetBlock title="Audio" filename={audioFile} downloadUrl={audioUrl}>
          <AudioPlayer
            url={audioUrl}
          />
        </AssetBlock>
      )}

      {!audioUrl && !videoUrl && !finalUrl && (
        <NoticeMessage
          title="No outputs available"
          message="The job completed but did not produce any downloadable files."
          tone="warning"
          compact
        />
      )}
    </div>
  )
}
