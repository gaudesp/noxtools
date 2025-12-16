type Props = {
  url: string
  className?: string
}

export default function AudioPlayer({ url, className }: Props) {
  return (
    <audio controls className={className ?? "w-full"}>
      <source src={url} />
      Your browser does not support the audio element.
    </audio>
  )
}
