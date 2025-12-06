import { useState } from "react"

type Props = {
  onUpload: (file: File) => void
  busy?: boolean
  errorMessage?: string | null
  lastJobId?: string | null
  fileName?: string | null
}

export default function JobUploader({
  onUpload,
  busy,
  errorMessage,
  lastJobId,
  fileName,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)

  function handleFileSelection(file: File | null) {
    if (!file) return
    onUpload(file)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelection(file)
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
          const input = document.getElementById(
            "job-uploader-input",
          ) as HTMLInputElement | null
          input?.click()
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          id="job-uploader-input"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
        />

        {!busy && (
          <>
            <p className="text-lg font-medium mb-2">Drag & drop an audio file here</p>
            <p className="text-sm text-neutral-400">
              or click to choose a file from your computer
            </p>
          </>
        )}

        {busy && (
          <p className="text-sm text-neutral-300">
            Uploading <span className="font-semibold">{fileName}</span>…
          </p>
        )}

        {errorMessage && (
          <p className="text-sm text-red-400 mt-2">
            {errorMessage}
          </p>
        )}
      </div>

      {lastJobId && (
        <div className="mt-4 text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-700 rounded px-3 py-2">
          Upload successful. Job created.
        </div>
      )}
    </div>
  )
}
