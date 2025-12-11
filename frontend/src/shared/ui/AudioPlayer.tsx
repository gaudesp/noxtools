type Props = {
  url: string
  mime?: string
  className?: string
}

function inferMime(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || ""
  switch (ext) {
    case "mp3":
      return "audio/mpeg"
    case "m4a":
      return "audio/mp4"
    case "wav":
      return "audio/wav"
    case "ogg":
      return "audio/ogg"
    case "flac":
      return "audio/flac"
    default:
      return "audio/mpeg"
  }
}

export default function AudioPlayer({ url, mime, className }: Props) {
  const resolvedMime = mime || inferMime(url)

  return (
    <audio controls className={className ?? "w-full"}>
      <source src={url} type={resolvedMime} />
      Your browser does not support the audio element.
    </audio>
  )
}
