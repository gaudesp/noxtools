import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { getNoxelizerSourceUrl, getNoxsongizerSourceUrl, type Job } from "../../lib/api"

const activeAudios = new Map<string, HTMLAudioElement>()

function pauseOthers(exceptId: string) {
  activeAudios.forEach((audio, id) => {
    if (id !== exceptId && !audio.paused) {
      audio.pause()
    }
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

function NoxsongizerPreview({ job }: { job: Job }) {
  const sourceUrl = useMemo(() => getNoxsongizerSourceUrl(job.id), [job.id])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const audio = new Audio(sourceUrl)
    audioRef.current = audio
    activeAudios.set(job.id, audio)

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)
    const handleError = () => setHasError(true)

    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.pause()
      audio.src = ""
      activeAudios.delete(job.id)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      audioRef.current = null
    }
  }, [sourceUrl])

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return
    setHasError(false)
    if (audio.paused) {
      pauseOthers(job.id)
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
      title={hasError ? "Unable to play audio" : "Play / pause source"}
      aria-pressed={isPlaying}
      className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-50 hover:border-violet-400 hover:text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
    >
      <PlayPauseIcon playing={isPlaying} />
    </button>
  )
}

function NoxelizerPreview({ job }: { job: Job }) {
  const sourceUrl = useMemo(() => getNoxelizerSourceUrl(job.id), [job.id])
  const hasSource = Boolean(job.input_path)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 overflow-hidden flex items-center justify-center"
    >
      {hasSource ? (
        <img
          src={sourceUrl}
          alt={job.input_filename || "Original upload"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="text-[10px] text-slate-500 uppercase tracking-wide">N/A</div>
      )}
    </div>
  )
}

export default function JobPreview({ job }: { job: Job }) {
  if (job.tool === "noxsongizer") return <NoxsongizerPreview job={job} />
  if (job.tool === "noxelizer") return <NoxelizerPreview job={job} />
  return null
}
