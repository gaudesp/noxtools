import { useState } from "react"

type Props = {
  onUpload: (files: File[]) => void
  files?: File[]
  onRemoveFile?: (file: File) => void
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
  files,
  onRemoveFile,
  busy,
  accept = "image/*",
  title = "Drag & drop files here",
  description = "or click to choose one or multiple files",
  inputId = "uploader-input",
  multiple = true,
  busyLabel = "Uploading…",
}: Props) {
  const [localFiles, setLocalFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const displayFiles = files ?? localFiles

  function handleFileSelection(list: FileList | null) {
    if (!list || list.length === 0) return

    const selected = Array.from(list)

    if (!files) {
      setLocalFiles(selected)
    }

    onUpload(selected)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelection(e.dataTransfer.files)
  }

  return (
    <div className="w-full">
      <div
        className={[
          "flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-6 py-12 cursor-pointer transition relative",
          isDragging
            ? "border-violet-400 bg-slate-900/60"
            : "border-slate-700 bg-slate-950 hover:border-violet-500 hover:bg-slate-900/40",
          busy ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
        onClick={() => document.getElementById(inputId)?.click()}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
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
            <p className="text-lg font-semibold text-neutral-200">{title}</p>
            <p className="text-sm text-neutral-400">{description}</p>
          </>
        )}

        {busy && <p className="text-sm text-neutral-300">{busyLabel}</p>}

        {displayFiles.length > 0 && !busy && (
          <div className="mt-6 flex flex-wrap justify-center gap-3 max-w-full">
            {displayFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-2 bg-slate-800/70 px-3 py-1.5 rounded-md text-sm text-neutral-200 border border-slate-700 max-w-60"
              >
                <svg
                  className="w-4 h-4 text-violet-300 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 3h8l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                  />
                </svg>

                <span className="truncate">{file.name}</span>

                {onRemoveFile && (
                  <button
                    type="button"
                    className="text-neutral-400 hover:text-red-400 transition"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveFile(file)
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
