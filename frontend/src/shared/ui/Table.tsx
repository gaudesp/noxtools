import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { type Job } from "@/entities/job"
import { API_BASE_URL } from "../api"
import NoticeMessage from "./NoticeMessage"
import DeleteConfirmModal from "./DeleteConfirmModal"
import StatusBadge from "./StatusBadge"
import Pagination from "./Pagination"

const getNoxsongizerSourceUrl = (jobId: string) =>
  `${API_BASE_URL}/noxsongizer/source/${jobId}`

const getNoxelizerSourceUrl = (jobId: string) =>
  `${API_BASE_URL}/noxelizer/source/${jobId}`

const getNoxtunizerSourceUrl = (jobId: string) =>
  `${API_BASE_URL}/noxtunizer/source/${jobId}`

type Props = {
  tasks: Job[]
  total: number
  pageSize: number
  currentPage: number
  onPageChange: (page: number) => void
  onSelectTask?: (task: Job) => void
  onDeleteTask?: (task: Job) => void
  loading?: boolean
  error?: string | null
  showHeader?: boolean
  bordered?: boolean
}

const formatDate = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleString()
}

const activeAudios = new Map<string, HTMLAudioElement>()

function pauseOthers(exceptId: string) {
  activeAudios.forEach((audio, id) => {
    if (id !== exceptId && !audio.paused) audio.pause()
  })
}

function PlayPauseIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  ) : (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4.5v15l12-7.5-12-7.5Z" />
    </svg>
  )
}

function AudioPreview({ task, sourceUrl }: { task: Job; sourceUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const audio = new Audio(sourceUrl)
    audioRef.current = audio
    activeAudios.set(task.id, audio)

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd = () => setIsPlaying(false)
    const onErr = () => setHasError(true)

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnd)
    audio.addEventListener("error", onErr)

    return () => {
      audio.pause()
      audio.src = ""
      activeAudios.delete(task.id)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnd)
      audio.removeEventListener("error", onErr)
      audioRef.current = null
    }
  }, [sourceUrl, task.id])

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    const audio = audioRef.current
    if (!audio) return

    setHasError(false)

    if (audio.paused) {
      pauseOthers(task.id)
      audio
        .play()
        .catch(() => {
          setHasError(true)
          setIsPlaying(false)
        })
    } else {
      audio.pause()
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-50 hover:border-violet-400 transition"
      aria-pressed={isPlaying}
      title={hasError ? "Unable to play audio" : "Play / pause source"}
    >
      <PlayPauseIcon playing={isPlaying} />
    </button>
  )
}

function ImagePreview({ task }: { task: Job }) {
  const source = useMemo(() => getNoxelizerSourceUrl(task.id), [task.id])
  const hasSource = Boolean(task.input_path)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 overflow-hidden flex items-center justify-center"
    >
      {hasSource ? (
        <img
          src={source}
          alt={task.input_filename || "Original upload"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">N/A</span>
      )}
    </div>
  )
}

function ModePreview({ task }: { task: Job }) {
  const mode = ((task.params?.mode as string) || "").toLowerCase()

  const palette = {
    audio: {
      wrapper: "border-emerald-400/60 bg-emerald-500/15 text-emerald-100",
      label: "Audio",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
          <path d="M9 18a3 3 0 1 1-3-3" />
          <path d="M9 18V6l11-2v10" />
          <path d="M20 14a3 3 0 1 1-3-3" />
        </svg>
      ),
    },
    video: {
      wrapper: "border-sky-400/60 bg-sky-500/15 text-sky-100",
      label: "Video",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
          <rect x="3" y="5" width="14" height="14" rx="2" />
          <path d="m17 9 4-2v10l-4-2" />
        </svg>
      ),
    },
    both: {
      wrapper: "border-amber-400/70 bg-amber-500/15 text-amber-100",
      label: "Both",
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
          <rect x="3" y="4" width="13" height="12" rx="2" />
          <path d="m16 8 4-3v10l-4-3" />
          <path d="M7 18h10" />
          <path d="M10 21h4" />
        </svg>
      ),
    },
  } as const

  const selected = palette[mode as keyof typeof palette] || palette.audio

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-inner ${selected.wrapper}`}
      title={selected.label}
      aria-label={selected.label}
    >
      {selected.icon}
    </div>
  )
}

function TaskPreview({ task }: { task: Job }) {
  if (task.tool === "noxsongizer") return <AudioPreview task={task} sourceUrl={getNoxsongizerSourceUrl(task.id)} />
  if (task.tool === "noxelizer") return <ImagePreview task={task} />
  if (task.tool === "noxtubizer") return <ModePreview task={task} />
  if (task.tool === "noxtunizer") return <AudioPreview task={task} sourceUrl={getNoxtunizerSourceUrl(task.id)} />
  return null
}

export default function Table({
  tasks,
  total,
  pageSize,
  currentPage,
  onPageChange,
  onSelectTask,
  onDeleteTask,
  loading,
  error,
  showHeader = true,
  bordered = true,
}: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div
      className={[
        "bg-slate-900",
        bordered ? "border border-slate-800 rounded-lg" : "rounded-none border-0",
      ].join(" ")}
    >
      {showHeader ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Tasks</h3>
            <p className="text-xs text-slate-500">
              Showing {tasks.length} of {total}
            </p>
          </div>
          <Pagination total={total} pageSize={pageSize} currentPage={currentPage} onPageChange={onPageChange} />
        </div>
      ) : null}

      {loading && (
        <div className="px-4 py-2 text-sm text-slate-400 flex items-center gap-2 border-b border-slate-800">
          <div className="h-4 w-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" aria-hidden />
          Loading tasks…
        </div>
      )}

      {error ? (
        <div className="px-4 py-3 border-b border-slate-800">
          <NoticeMessage title="Unable to load tasks" message={error} tone="danger" compact />
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-slate-200">
          <thead className="bg-slate-800/60 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Preview</th>
              <th className="px-4 py-3 text-left">File</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className={[
                  "border-t border-slate-800 first:border-t-0",
                  onSelectTask ? "hover:bg-slate-800/40 transition cursor-pointer" : "",
                ].join(" ")}
                onClick={() => onSelectTask && onSelectTask(task)}
              >
                <td className="px-4 py-3 align-middle">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <TaskPreview task={task} />
                </td>
                <td className="px-4 py-3 align-middle text-slate-100">
                  {task.input_filename || "Unknown file"}
                  <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wide">{task.tool}</p>
                </td>
                <td className="px-4 py-3 align-middle text-slate-300">{formatDate(task.created_at)}</td>
                <td className="px-4 py-3 align-middle text-right relative">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={task.status === "running"}
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation()
                        setConfirmDeleteId(task.id)
                      }}
                      className="text-xs px-2 py-1 rounded border border-rose-700 text-rose-200 hover:border-rose-500 hover:text-rose-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                  <DeleteConfirmModal
                    open={confirmDeleteId === task.id}
                    onCancel={(e?: MouseEvent) => {
                      if (e) e.stopPropagation()
                      setConfirmDeleteId(null)
                    }}
                    onConfirm={(e?: MouseEvent) => {
                      if (e) e.stopPropagation()
                      onDeleteTask && onDeleteTask(task)
                      setConfirmDeleteId(null)
                    }}
                  />
                </td>
              </tr>
            ))}
            {tasks.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No tasks to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!showHeader && totalPages > 1 ? (
        <div className="border-t border-slate-800 px-4 py-3">
          <Pagination total={total} pageSize={pageSize} currentPage={currentPage} onPageChange={onPageChange} />
        </div>
      ) : null}
    </div>
  )
}
