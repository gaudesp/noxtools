import { type ReactNode } from "react"
import NoticeMessage from "../../../shared/components/NoticeMessage"
import {
  getNoxtubizerDownloadUrl,
  type Job,
  type NoxtubizerJobResult,
} from "../api/api"
import NoxtubizerVideoPlayer from "./NoxtubizerVideoPlayer"

const AUDIO_QUALITY_LABELS: Record<string, string> = {
  high: "Best available",
  "320kbps": "320 kbps",
  "256kbps": "256 kbps",
  "128kbps": "128 kbps",
  "64kbps": "64 kbps",
}

const VIDEO_QUALITY_LABELS: Record<string, string> = {
  best: "Best available",
  "4320p": "4320p (8K)",
  "2160p": "2160p (4K)",
  "1440p": "1440p (2K)",
  "1080p": "1080p",
  "720p": "720p",
  "480p": "480p",
  "360p": "360p",
  "240p": "240p",
}

function mimeFromExtension(ext: string) {
  const n = ext.toLowerCase()
  if (n === "mp3") return "audio/mpeg"
  if (n === "m4a") return "audio/mp4"
  if (n === "ogg") return "audio/ogg"
  if (n === "wav") return "audio/wav"
  return "application/octet-stream"
}

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

export default function NoxtubizerResultPreview({ job }: { job: Job }) {
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

  const realVideoHeight = video?.real_height ?? both?.real_height ?? null
  const realAudioBitrate = audio?.real_bitrate ?? both?.real_bitrate ?? null

  return (
    <div className="space-y-3">
      {mode === "both" && finalUrl && finalFile && (
        <AssetBlock title="Audio + Video" filename={finalFile} downloadUrl={finalUrl}>
          <NoxtubizerVideoPlayer
            url={finalUrl}
            filename={finalFile}
            height={380}
            hasAudio={true}
          />
        </AssetBlock>
      )}

      {mode === "video" && videoUrl && videoFile && (
        <AssetBlock title="Video" filename={videoFile} downloadUrl={videoUrl}>
          <NoxtubizerVideoPlayer
            url={videoUrl}
            filename={videoFile}
            height={360}
            hasAudio={false}
          />
        </AssetBlock>
      )}

      {mode === "audio" && audioUrl && audioFile && (
        <AssetBlock title="Audio" filename={audioFile} downloadUrl={audioUrl}>
          <audio controls className="w-full">
            <source
              src={audioUrl}
              type={mimeFromExtension(audioFile.split(".").pop() || "mp3")}
            />
          </audio>
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

      <div className="text-xs text-slate-400">
        <span className="mr-3">Mode: {mode.toUpperCase()}</span>

        {(audio || both) && (
          <span className="mr-3">
            Audio: {(audio?.format || both?.audio_format || "").toUpperCase()} •{" "}
            {realAudioBitrate
              ? `${realAudioBitrate} kbps`
              : AUDIO_QUALITY_LABELS[(audio?.quality || both?.audio_quality) ?? ""] ||
                (audio?.quality || both?.audio_quality)}
          </span>
        )}

        {(video || both) && (
          <span className="mr-3">
            Video: {(video?.format || both?.format || "").toUpperCase()} •{" "}
            {realVideoHeight
              ? `${realVideoHeight}p`
              : VIDEO_QUALITY_LABELS[video?.quality ?? ""]}
          </span>
        )}

      </div>
    </div>
  )
}
