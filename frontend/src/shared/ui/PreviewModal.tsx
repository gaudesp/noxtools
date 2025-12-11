import { useEffect, type ReactNode } from "react"
import { type Job } from "@/lib/api/core"
import StatusBadge from "@/shared/ui/StatusBadge"

type Props = {
  task: Job | null
  open: boolean
  onClose: () => void
  renderPreview: (task: Job) => ReactNode
}

const formatDate = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleString()
}

function Dates({ task }: { task: Job }) {
  return (
    <div className="grid grid-cols-1 gap-3 text-xs text-slate-500 md:grid-cols-3">
      <p>Created: {formatDate(task.created_at)}</p>
      {task.started_at ? <p>Started: {formatDate(task.started_at)}</p> : null}
      {task.completed_at ? <p>Completed: {formatDate(task.completed_at)}</p> : null}
    </div>
  )
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

function FooterTags({ task }: { task: Job }) {
  const tags: string[] = []

  if (task.tool === "noxtubizer") {
    const result = (task.result as Record<string, any> | undefined) || {}
    const mode = ((task.params?.mode as string) || result.mode || "").toUpperCase()
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
        audio?.quality ||
        both?.audio_quality ||
        ""
      tags.push(`Audio: ${format}${bitrate ? ` • ${bitrate} kbps` : ""}`)
    }
    if (video || both) {
      const format = (video?.format || both?.format || "").toUpperCase()
      const heightLabel = realVideoHeight
        ? `${realVideoHeight}p`
        : VIDEO_QUALITY_LABELS[video?.quality ?? ""] || ""
      tags.push(`Video: ${format}${heightLabel ? ` • ${heightLabel}` : ""}`)
    }
  }

  if (task.tool === "noxelizer") {
    const frames = (task.result as Record<string, any> | undefined)?.frames_written
    const fps = (task.result as Record<string, any> | undefined)?.fps
    if (typeof frames === "number") tags.push(`Frames: ${frames}`)
    if (typeof fps === "number") tags.push(`FPS: ${fps}`)
  }

  if (tags.length === 0) return null

  return (
    <footer className="flex items-center justify-between gap-3 border-t border-slate-800 px-5 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
        {tags.map((tag) => (
          <span key={tag} className="rounded border border-slate-700 bg-slate-900 px-3 py-1">
            {tag}
          </span>
        ))}
      </div>
    </footer>
  )
}

function Header({ task, onClose }: { task: Job; onClose: () => void }) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-white">Task preview</h2>
        <p className="text-xs text-slate-400">
          {task.tool.toUpperCase()} • {task.input_filename || "Unnamed input"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={task.status} />
        <button
          type="button"
          className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </header>
  )
}

export default function PreviewModal({ task, open, onClose, renderPreview }: Props) {
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open || !task) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <Header task={task} onClose={onClose} />

        <div className="px-5 py-4">
          <Dates task={task} />

          <div className="mt-6">{renderPreview(task)}</div>
        </div>

        <FooterTags task={task} />
      </div>
    </div>
  )
}
