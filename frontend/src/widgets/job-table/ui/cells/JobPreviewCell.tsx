import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react"
import type { Job } from "@/entities/job"
import { API_BASE_URL } from "@/shared/api"

const activeAudios = new Map<string, HTMLAudioElement>()

function pauseOthers(exceptId: string) {
  activeAudios.forEach((audio, id) => {
    if (id !== exceptId && !audio.paused) audio.pause()
  })
}

function PlayPauseIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  ) : (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4.5v15l12-7.5-12-7.5Z" />
    </svg>
  )
}

function AudioPreview({ job, sourceUrl }: { job: Job; sourceUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const audio = new Audio(sourceUrl)
    audioRef.current = audio
    activeAudios.set(job.id, audio)

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
      activeAudios.delete(job.id)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnd)
      audio.removeEventListener("error", onErr)
      audioRef.current = null
    }
  }, [sourceUrl, job.id])

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return

    setHasError(false)

    if (audio.paused) {
      pauseOthers(job.id)
      audio.play().catch(() => {
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

function ImagePreview({ job }: { job: Job }) {
  const source = useMemo(
    () => `${API_BASE_URL}/noxelizer/source/${job.id}`,
    [job.id],
  )
  const hasSource = Boolean(job.input_path)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 overflow-hidden flex items-center justify-center"
    >
      {hasSource ? (
        <img
          src={source}
          alt={job.input_filename || "Original upload"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">
          N/A
        </span>
      )}
    </div>
  )
}

function ModePreview({ job }: { job: Job }) {
  const mode = ((job.params?.mode as string) || "").toLowerCase()

  const palette = {
    audio: {
      wrapper: "border-emerald-400/60 bg-emerald-500/15 text-emerald-100",
      label: "Audio",
      icon: (
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
        >
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
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
        >
          <rect x="3" y="5" width="14" height="14" rx="2" />
          <path d="m17 9 4-2v10l-4-2" />
        </svg>
      ),
    },
    both: {
      wrapper: "border-amber-400/70 bg-amber-500/15 text-amber-100",
      label: "Both",
      icon: (
        <svg
          className="w-7 h-7"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
        >
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

export default function JobPreviewCell({ job }: { job: Job }) {
  if (job.tool === "noxsongizer")
    return (
      <AudioPreview
        job={job}
        sourceUrl={`${API_BASE_URL}/noxsongizer/source/${job.id}`}
      />
    )

  if (job.tool === "noxtunizer")
    return (
      <AudioPreview
        job={job}
        sourceUrl={`${API_BASE_URL}/noxtunizer/source/${job.id}`}
      />
    )

  if (job.tool === "noxelizer") return <ImagePreview job={job} />

  if (job.tool === "noxtubizer") return <ModePreview job={job} />

  return null
}
