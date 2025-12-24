import { useEffect, useRef, useState, type MouseEvent } from "react"
import Spinner from "../feedback/Spinner"

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

type Props = {
  id: string
  sourceUrl: string
}

export default function AudioPreviewButton({ id, sourceUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle")

  useEffect(() => {
    setStatus("idle")
    setIsPlaying(false)
    setHasError(false)

    return () => cleanupRef.current?.()
  }, [id, sourceUrl])

  function initAudio(): HTMLAudioElement {
    if (audioRef.current) return audioRef.current

    const audio = new Audio()
    audio.preload = "none"
    audio.src = sourceUrl

    audioRef.current = audio
    activeAudios.set(id, audio)

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd = () => setIsPlaying(false)
    const onCanPlay = () => setStatus("ready")
    const onError = () => {
      setHasError(true)
      setStatus("idle")
      setIsPlaying(false)
    }

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnd)
    audio.addEventListener("canplay", onCanPlay)
    audio.addEventListener("error", onError)

    cleanupRef.current = () => {
      audio.pause()
      audio.src = ""
      activeAudios.delete(id)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnd)
      audio.removeEventListener("canplay", onCanPlay)
      audio.removeEventListener("error", onError)
      audioRef.current = null
      cleanupRef.current = null
    }

    return audio
  }

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    setHasError(false)

    const audio = audioRef.current ?? initAudio()

    if (audio.paused) {
      pauseOthers(id)
      setStatus("loading")

      audio.play().catch(() => {
        setHasError(true)
        setStatus("idle")
        setIsPlaying(false)
      })
    } else {
      audio.pause()
    }
  }

  const isLoading = status === "loading"

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isPlaying}
      aria-busy={isLoading}
      disabled={isLoading}
      title={
        hasError
          ? "Unable to play audio"
          : isLoading
            ? "Loading preview…"
            : "Play / pause source"
      }
      className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-50 hover:border-violet-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Spinner size="sm" className="text-slate-100" ariaLabel="Loading preview" />
      ) : (
        <PlayPauseIcon playing={isPlaying} />
      )}
    </button>
  )
}
