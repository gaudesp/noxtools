import { useEffect, useRef, useState } from "react"

type Props = {
  url: string
  height?: number
  hasAudio?: boolean
}

export default function VideoPlayer({
  url,
  height = 360,
  hasAudio = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
    videoRef.current?.load()
  }, [url])

  return (
    <div className="relative">
      <video
        ref={videoRef}
        playsInline
        controls
        muted={!hasAudio}
        className="w-full rounded border border-slate-800 bg-black object-contain shadow-inner"
        style={{ minHeight: height, height }}
        onError={() => setHasError(true)}
        onLoadedData={() => setHasError(false)}
      >
        <source src={url} />
        This video cannot be played in your browser.
      </video>

      {!hasAudio && (
        <div className="absolute right-3 top-3 rounded border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200">
          No audio track
        </div>
      )}

      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded border border-slate-800 bg-slate-950/85 px-4 text-center"
          style={{ minHeight: height, height }}
        >
          <p className="text-sm text-slate-100">
            This file cannot be previewed in your browser. Download to play locally.
          </p>
        </div>
      )}
    </div>
  )
}
