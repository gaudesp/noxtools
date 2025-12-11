import NoticeMessage from "@/shared/ui/NoticeMessage"
import AudioPlayer from "@/shared/ui/AudioPlayer"
import VideoPlayer from "@/shared/ui/VideoPlayer"
import {
  getNoxtubizerDownloadUrl,
  type Job,
  type NoxtubizerJobResult,
} from "@/features/noxtubizer/api"
import {
  getNoxtubizerMode,
  getNoxtubizerResult,
  isNoxtubizerJob,
} from "@/features/noxtubizer/model"
import AssetBlock from "./AssetBlock"

export default function ResultPreview({ job }: { job: Job }) {
  if (!isNoxtubizerJob(job)) return null

  if (job.status === "pending")
    return <NoticeMessage message="Job is queued…" tone="warning" />

  if (job.status === "running")
    return <NoticeMessage message="Job is running…" withSpinner tone="info" />

  if (job.status === "error")
    return (
      <NoticeMessage
        title="Job failed"
        message="An error occurred during processing."
        details={job.error_message}
        tone="danger"
      />
    )

  const result: NoxtubizerJobResult = getNoxtubizerResult(job) || {}
  const mode = getNoxtubizerMode(job)

  const audio = result.audio?.filename ?? null
  const video = result.video?.filename ?? null
  const both = result.both?.filename ?? null

  const audioUrl = audio ? getNoxtubizerDownloadUrl(job.id, audio) : null
  const videoUrl = video ? getNoxtubizerDownloadUrl(job.id, video) : null
  const bothUrl = both ? getNoxtubizerDownloadUrl(job.id, both) : null

  if (!audioUrl && !videoUrl && !bothUrl)
    return (
      <NoticeMessage
        title="No outputs"
        message="The job completed but produced no downloadable files."
        tone="warning"
      />
    )

  return (
    <div className="space-y-3">
      {mode === "both" && bothUrl && both && (
        <AssetBlock title="Audio + Video" filename={both} downloadUrl={bothUrl}>
          <VideoPlayer url={bothUrl} hasAudio={true} filename={both} height={400} />
        </AssetBlock>
      )}

      {mode === "video" && videoUrl && video && (
        <AssetBlock title="Video" filename={video} downloadUrl={videoUrl}>
          <VideoPlayer url={videoUrl} hasAudio={false} filename={video} height={400} />
        </AssetBlock>
      )}

      {mode === "audio" && audioUrl && audio && (
        <AssetBlock title="Audio" filename={audio} downloadUrl={audioUrl}>
          <AudioPlayer url={audioUrl} />
        </AssetBlock>
      )}
    </div>
  )
}
