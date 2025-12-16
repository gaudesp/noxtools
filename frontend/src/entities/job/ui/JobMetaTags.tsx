import type { Job, JobTool } from "../model/types"
import { Tag } from "@/shared/ui"
import JobDateTags from "./JobDateTag"

type TagItem = {
  label: string
  value?: string
  className?: string
}

const NEUTRAL_TAG_CLASSNAME = "border-slate-800 bg-slate-900 text-slate-100"

function formatNumber(value?: number | null): string | null {
  if (value === null || value === undefined) return null
  if (!Number.isFinite(value)) return null

  const rounded = Math.abs(value % 1) < 0.001 ? Math.round(value) : value
  const str = typeof rounded === "number" ? rounded.toString() : String(rounded)

  if (str.includes(".")) {
    const num = Number(str)
    return Number.isNaN(num) ? str : num.toFixed(2).replace(/\.?0+$/, "")
  }

  return Number(rounded).toLocaleString()
}

function buildNoxsongizerTags(job: Job, accentClassName?: string, neutralClassName?: string): TagItem[] {
  return [{
    label: job.tool.toUpperCase(),
    className: accentClassName ?? neutralClassName,
  }]
}

type NoxelizerShape = Job & {
  result?: {
    frames_written?: number | null
    fps?: number | null
    duration?: number | null
    final_hold?: number | null
    codec?: string | null
  }
  params?: {
    fps?: number | null
    duration?: number | null
    final_hold?: number | null
  }
}

function buildNoxelizerTags(job: NoxelizerShape, accentClassName?: string, neutralClassName?: string): TagItem[] {
  const frames = job.result?.frames_written
  const fps = job.result?.fps ?? job.params?.fps
  const duration = job.result?.duration ?? job.params?.duration
  const finalHold = job.result?.final_hold ?? job.params?.final_hold
  const codec = job.result?.codec

  return [
    { label: job.tool.toUpperCase(), className: accentClassName ?? neutralClassName },
    frames !== undefined && frames !== null
      ? { label: "Frames", value: formatNumber(frames) ?? undefined, className: neutralClassName }
      : null,
    fps !== undefined && fps !== null
      ? { label: "FPS", value: formatNumber(fps) ?? undefined, className: neutralClassName }
      : null,
    duration !== undefined && duration !== null
      ? { label: "Duration", value: formatNumber(duration) ?? undefined, className: neutralClassName }
      : null,
    finalHold !== undefined && finalHold !== null
      ? { label: "Hold", value: formatNumber(finalHold) ?? undefined, className: neutralClassName }
      : null,
    codec
      ? { label: "Codec", value: codec, className: neutralClassName }
      : null,
  ].filter(Boolean) as TagItem[]
}

type NoxtubizerShape = Job & {
  params?: {
    mode?: string | null
    audio_quality?: string | null
    audio_format?: string | null
    video_quality?: string | null
    video_format?: string | null
  }
  result?: {
    mode?: string | null
    audio?: { format?: string; quality?: string; real_bitrate?: number | null } | null
    video?: { format?: string; quality?: string; real_height?: number | null } | null
    both?: {
      format?: string
      audio_format?: string
      audio_quality?: string
      real_bitrate?: number | null
      real_height?: number | null
    } | null
  }
}

function buildNoxtubizerTags(job: NoxtubizerShape, accentClassName?: string, neutralClassName?: string): TagItem[] {
  const mode = (job.result?.mode ?? job.params?.mode) || null
  const audioFormat =
    job.result?.audio?.format ??
    job.result?.both?.audio_format ??
    job.params?.audio_format ??
    null
  const audioQuality =
    job.result?.audio?.quality ??
    job.result?.both?.audio_quality ??
    job.params?.audio_quality ??
    null
  const videoFormat =
    job.result?.video?.format ??
    job.result?.both?.format ??
    job.params?.video_format ??
    null
  const videoQuality =
    job.result?.video?.quality ??
    job.params?.video_quality ??
    null
  const realBitrate =
    job.result?.audio?.real_bitrate ??
    job.result?.both?.real_bitrate ??
    null
  const realHeight =
    job.result?.video?.real_height ??
    job.result?.both?.real_height ??
    null

  const tags: Array<TagItem | null> = [
    { label: job.tool.toUpperCase(), className: accentClassName ?? neutralClassName },
  ]

  if (mode === "audio" || mode === "both") {
    if (audioFormat || audioQuality) {
      tags.push({
        label: "Audio",
        value: [audioFormat, audioQuality].filter(Boolean).join(" • "),
        className: neutralClassName,
      })
    }
  }

  if (mode === "video" || mode === "both") {
    if (videoFormat || videoQuality) {
      tags.push({
        label: "Video",
        value: [videoFormat, videoQuality].filter(Boolean).join(" • "),
        className: neutralClassName,
      })
    }
  }

  if (realBitrate !== null && realBitrate !== undefined) {
    tags.push({
      label: "Bitrate",
      value: formatNumber(realBitrate) ?? undefined,
      className: neutralClassName,
    })
  }

  if (realHeight !== null && realHeight !== undefined) {
    const formattedHeight = formatNumber(realHeight)
    tags.push({
      label: "Height",
      value: formattedHeight ? `${formattedHeight}p` : undefined,
      className: neutralClassName,
    })
  }

  return tags.filter(Boolean) as TagItem[]
}

function buildNoxtunizerTags(job: Job, accentClassName?: string, neutralClassName?: string): TagItem[] {
  return [{
    label: job.tool.toUpperCase(),
    className: accentClassName ?? neutralClassName,
  }]
}

function buildTags(job: Job, accentClassName?: string, neutralClassName?: string): TagItem[] {
  switch (job.tool) {
    case "noxsongizer":
      return buildNoxsongizerTags(job, accentClassName, neutralClassName)
    case "noxelizer":
      return buildNoxelizerTags(job as NoxelizerShape, accentClassName, neutralClassName)
    case "noxtubizer":
      return buildNoxtubizerTags(job as NoxtubizerShape, accentClassName, neutralClassName)
    case "noxtunizer":
      return buildNoxtunizerTags(job, accentClassName, neutralClassName)
    default:
      return []
  }
}

export default function JobMetaTags({
  job,
  toolColor,
  mode = "all",
  showDates = true,
}: {
  job: Job
  toolColor?: (tool: JobTool) => string | undefined
  mode?: "all" | "tool-only"
  showDates?: boolean
}) {
  const tags = buildTags(
    job,
    toolColor?.(job.tool),
  )
  if (!tags.length) return null

  const renderedTags = mode === "tool-only" ? tags.slice(0, 1) : tags
  const shouldRenderDates = showDates && mode === "all"

  return (
    <div className="flex flex-wrap gap-2">
      {renderedTags.map((tag) => (
        <Tag
          key={`${tag.label}-${tag.value ?? "value"}`}
          className={tag.className ?? NEUTRAL_TAG_CLASSNAME}
        >
          {tag.value ? `${tag.label} : ${tag.value}` : tag.label}
        </Tag>
      ))}
      {shouldRenderDates && (
        <JobDateTags
          createdAt={job.created_at}
          startedAt={job.started_at}
          completedAt={job.completed_at}
          status={job.status}
        />
      )}
    </div>
  )
}
