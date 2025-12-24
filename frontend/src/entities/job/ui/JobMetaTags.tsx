import type { Job, JobTool, JobResult } from "../model/types"
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

function formatMetaValue(value?: string | number | null): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") return formatNumber(value)
  return value
}

function buildNoxsongizerTags(job: Job, accentClassName?: string, neutralClassName?: string): TagItem[] {
  return [{
    label: job.tool.toUpperCase(),
    className: accentClassName ?? neutralClassName,
  }]
}

type NoxelizerSummary = {
  frames?: number | null
  fps?: number | null
  duration?: number | null
  hold?: number | null
  codec?: string | null
}

type NoxelizerParams = {
  fps?: number | null
  duration?: number | null
  final_hold?: number | null
}

type NoxelizerShape = Job<NoxelizerParams, JobResult<NoxelizerSummary>>

function buildNoxelizerTags(job: NoxelizerShape, accentClassName?: string, neutralClassName?: string): TagItem[] {
  const summary = job.result?.summary
  const frames = summary?.frames
  const fps = summary?.fps ?? job.params?.fps
  const duration = summary?.duration ?? job.params?.duration
  const finalHold = summary?.hold ?? job.params?.final_hold
  const codec = summary?.codec

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

type NoxtubizerSummary = {
  mode?: string | null
  title?: string | null
  url?: string | null
}

type NoxtubizerParams = {
  mode?: string | null
  audio_quality?: string | null
  audio_format?: string | null
  video_quality?: string | null
  video_format?: string | null
}

type NoxtubizerShape = Job<NoxtubizerParams, JobResult<NoxtubizerSummary>>

function buildNoxtubizerTags(job: NoxtubizerShape, accentClassName?: string, neutralClassName?: string): TagItem[] {
  const summary = job.result?.summary
  const mode = (summary?.mode ?? job.params?.mode) || null
  const outputs = job.result?.files?.filter((item) => item.role === "output") ?? []
  const audioOutput = outputs.find((item) => item.file.type === "audio")?.file
  const videoOutput = outputs.find((item) => item.file.type === "video")?.file

  const audioFormat =
    formatMetaValue(audioOutput?.format) ??
    job.params?.audio_format ??
    null
  const audioQuality =
    formatMetaValue(audioOutput?.quality) ??
    job.params?.audio_quality ??
    null
  const videoFormat =
    formatMetaValue(videoOutput?.format) ??
    job.params?.video_format ??
    null
  const videoQuality =
    formatMetaValue(videoOutput?.quality) ??
    job.params?.video_quality ??
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
