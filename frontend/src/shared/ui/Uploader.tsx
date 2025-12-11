import { useState } from "react"

type Props = {
  onUpload: (files: File[]) => void
  busy?: boolean
  accept?: string
  title?: string
  description?: string
  inputId?: string
  multiple?: boolean
  busyLabel?: string
}

export default function Uploader({
  onUpload,
  busy,
  accept = "audio/*",
  title = "Drag & drop files here",
  description = "or click to choose one or multiple files from your computer",
  inputId = "uploader-input",
  multiple = true,
  busyLabel = "Uploading files…",
}: Props) {
  const [isDragging, setIsDragging] = useState(false)

  function handleFileSelection(files: FileList | null) {
    if (!files || files.length === 0) return
    onUpload(Array.from(files))
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) handleFileSelection(files)
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  return (
    <div>
      <div
        className={[
          "flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-6 py-12 cursor-pointer transition",
          isDragging
            ? "border-violet-400 bg-slate-900/60"
            : "border-slate-500 bg-slate-950 hover:border-violet-400 hover:bg-slate-900/50",
          busy ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
        onClick={() => {
          const input = document.getElementById(inputId) as HTMLInputElement | null
          input?.click()
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFileSelection(e.target.files)}
        />

        {!busy && (
          <>
            <p className="text-lg font-medium mb-2">{title}</p>
            <p className="text-sm text-neutral-400">{description}</p>
          </>
        )}

        {busy && <p className="text-sm text-neutral-300">{busyLabel}</p>}
      </div>
    </div>
  )
}
