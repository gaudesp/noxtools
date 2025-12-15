import { useEffect, useRef, useState, type MouseEvent } from "react"

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const audio = new Audio(sourceUrl)
    audioRef.current = audio
    activeAudios.set(id, audio)

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
      activeAudios.delete(id)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnd)
      audio.removeEventListener("error", onErr)
      audioRef.current = null
    }
  }, [sourceUrl, id])

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return

    setHasError(false)

    if (audio.paused) {
      pauseOthers(id)
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
      aria-pressed={isPlaying}
      title={hasError ? "Unable to play audio" : "Play / pause source"}
      className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-50 hover:border-violet-400 transition"
    >
      <PlayPauseIcon playing={isPlaying} />
    </button>
  )
}
