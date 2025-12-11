import { type Job } from "@/lib/api/core"

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

type Props = {
  job: Job
}

export default function Footer({ job }: Props) {
  const tags: string[] = []

  if (job.tool === "noxtubizer") {
    const result = (job.result as Record<string, any> | undefined) || {}
    const mode = ((job.params?.mode as string) || result.mode || "").toUpperCase()
    const audio = result.audio
    const video = result.video
    const both = result.both
    const realVideoHeight = video?.real_height ?? both?.real_height ?? null
    const realAudioBitrate = audio?.real_bitrate ?? both?.real_bitrate ?? null

    if (mode) tags.push(`Mode: ${mode}`)
    if (audio || both) {
      const format = (audio?.format || both?.audio_format || "").toUpperCase()
      const bitrate =
        realAudioBitrate ||
        AUDIO_QUALITY_LABELS[(audio?.quality || both?.audio_quality) ?? ""] ||
        audio?.quality ||
        both?.audio_quality ||
        ""
      tags.push(`Audio: ${format}${bitrate ? ` • ${bitrate}` : ""}`)
    }
    if (video || both) {
      const format = (video?.format || both?.format || "").toUpperCase()
      const heightLabel = realVideoHeight
        ? `${realVideoHeight}p`
        : VIDEO_QUALITY_LABELS[video?.quality ?? ""] || ""
      tags.push(`Video: ${format}${heightLabel ? ` • ${heightLabel}` : ""}`)
    }
  }

  if (job.tool === "noxelizer") {
    const frames = (job.result as Record<string, any> | undefined)?.frames_written
    const fps = (job.result as Record<string, any> | undefined)?.fps
    if (typeof frames === "number") tags.push(`Frames: ${frames}`)
    if (typeof fps === "number") tags.push(`FPS: ${fps}`)
  }

  if (tags.length === 0) return null

  return (
    <footer className="flex items-center justify-between gap-3 border-t border-slate-800 px-5 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded border border-slate-700 bg-slate-900 px-3 py-1"
          >
            {tag}
          </span>
        ))}
      </div>
    </footer>
  )
}
