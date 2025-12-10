import { useEffect, useMemo, useRef, useState } from "react"

type Props = {
  url: string
  filename: string | null
  height?: number
  hasAudio?: boolean
}

function mimeFromExtension(ext: string) {
  const x = ext.toLowerCase()

  switch (x) {
    case "mp4":
      return "video/mp4"
    case "mkv":
      return "video/x-matroska"
    case "webm":
      return "video/webm"
    case "mov":
      return "video/quicktime"
    default:
      return "video/mp4"
  }
}

export default function NoxtubizerVideoPlayer({
  url,
  filename,
  height = 360,
  hasAudio = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hasError, setHasError] = useState(false)

  const mime = useMemo(() => {
    const ext = (filename || "").split(".").pop() || ""
    return mimeFromExtension(ext)
  }, [filename])

  useEffect(() => {
    setHasError(false)
    const video = videoRef.current
    if (!video) return
    video.load()
  }, [url, mime])

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
        <source src={url} type={mime} />

        <p className="text-xs text-slate-300">
          This format cannot be previewed in your browser. Please download the file instead.
        </p>
      </video>

      {hasAudio === false && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded bg-slate-900/80 border border-slate-700 text-[11px] uppercase tracking-wide text-slate-200">
          No audio track
        </div>
      )}

      {hasError && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded border border-slate-800 bg-slate-950/85 text-center px-4"
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
