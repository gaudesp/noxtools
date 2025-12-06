import { useEffect, useState } from "react"
import {
  getNoxsongizerDownloadUrl,
  getNoxsongizerStatus,
  uploadNoxsongizer,
  type NoxsongizerStatusResponse,
} from "../lib/api"

type UiState =
  | "idle"
  | "uploading"
  | "pending"
  | "processing"
  | "done"
  | "error"

const STEM_LABELS: Record<string, string> = {
  "vocals.wav": "Vocals",
  "drums.wav": "Drums",
  "bass.wav": "Bass",
  "other.wav": "Other",
}

export default function Noxsongizer() {
  const [uiState, setUiState] = useState<UiState>("idle")
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [stems, setStems] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // -----------------------------
  // Polling
  // -----------------------------
  useEffect(() => {
    if (!jobId) return

    const interval = setInterval(async () => {
      try {
        const res: NoxsongizerStatusResponse =
          await getNoxsongizerStatus(jobId)

        setStatus(res.status)
        setStems(res.stems || [])

        if (res.status === "pending" || res.status === "processing") {
          setUiState(res.status)
        }

        if (res.status === "done") {
          setUiState("done")
          clearInterval(interval)
        }

        if (res.status === "error" || res.status === "unknown") {
          setUiState("error")
          setErrorMessage(res.error || "An error occurred during separation.")
          clearInterval(interval)
        }
      } catch (err) {
        console.error(err)
        setUiState("error")
        setErrorMessage("Failed to fetch job status.")
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [jobId])

  // -----------------------------
  // Upload logic
  // -----------------------------
  async function startUpload(file: File) {
    try {
      setErrorMessage(null)
      setStems([])
      setUiState("uploading")
      setStatus(null)

      const res = await uploadNoxsongizer(file)
      setJobId(res.job_id)
      setStatus("pending")
      setUiState("pending")
      setFileName(res.filename)
    } catch (err) {
      console.error(err)
      setUiState("error")
      setErrorMessage("File upload failed.")
    }
  }

  function handleFileSelection(file: File | null) {
    if (!file) return
    setFileName(file.name)
    startUpload(file)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
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

  function handleRetry() {
    setUiState("idle")
    setJobId(null)
    setStatus(null)
    setFileName(null)
    setStems([])
    setErrorMessage(null)
  }

  const isBusy =
    uiState === "uploading" ||
    uiState === "pending" ||
    uiState === "processing"

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Noxsongizer</h1>

      {/* Drag & Drop zone */}
      <div
        className={[
          "flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-6 py-12 cursor-pointer transition",
          isDragging
            ? "border-purple-400 bg-purple-500/10"
            : "border-neutral-700 bg-neutral-900",
          isBusy ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
        onClick={() => {
          const input = document.getElementById(
            "noxsongizer-file-input",
          ) as HTMLInputElement | null
          input?.click()
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          id="noxsongizer-file-input"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
        />

        {uiState === "idle" && (
          <>
            <p className="text-lg font-medium mb-2">
              Drag & drop an audio file here
            </p>
            <p className="text-sm text-neutral-400">
              or click to choose a file from your computer
            </p>
          </>
        )}

        {uiState === "uploading" && (
          <p className="text-sm text-neutral-300">
            Uploading <span className="font-semibold">{fileName}</span>…
          </p>
        )}

        {(uiState === "pending" || uiState === "processing") && (
          <p className="text-sm text-neutral-300">
            Separating{" "}
            {fileName ? (
              <span className="font-semibold">{fileName}</span>
            ) : (
              "your track"
            )}{" "}
            with Demucs…
          </p>
        )}

        {uiState === "done" && (
          <p className="text-sm text-neutral-300">
            Job completed for{" "}
            {fileName ? (
              <span className="font-semibold">{fileName}</span>
            ) : (
              "your track"
            )}
            .
          </p>
        )}

        {uiState === "error" && (
          <p className="text-sm text-red-400">
            An error occurred. You can try again with another file.
          </p>
        )}
      </div>

      {/* Status / loader */}
      {jobId && (
        <div className="mt-6 bg-neutral-900 rounded-lg p-4">
          <p className="text-sm text-neutral-400 mb-1">
            Job ID : <span className="text-neutral-100">{jobId}</span>
          </p>
          <p className="text-sm text-neutral-400 mb-3">
            Status :{" "}
            <span className="font-semibold text-neutral-100">
              {status ?? "unknown"}
            </span>
          </p>

          {isBusy && (
            <div className="mt-2 flex items-center gap-2 text-sm text-neutral-300">
              <div className="h-4 w-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <span>Processing…</span>
            </div>
          )}

          {uiState === "error" && errorMessage && (
            <div className="mt-3 bg-red-900/40 border border-red-700 rounded p-3 text-sm">
              <p className="font-semibold mb-1">Separation error</p>
              <p className="text-red-200 mb-2">{errorMessage}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="px-3 py-1 text-sm bg-red-500 rounded hover:bg-red-600 transition"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stems preview */}
      {uiState === "done" && jobId && stems.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Separated stems</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {stems.map((stem) => {
              const label = STEM_LABELS[stem] ?? stem
              const url = getNoxsongizerDownloadUrl(jobId, stem)

              return (
                <div
                  key={stem}
                  className="bg-neutral-900 rounded-lg p-4 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{label}</span>
                    <a
                      href={url}
                      download
                      className="text-xs px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 transition"
                    >
                      Download
                    </a>
                  </div>
                  <audio controls className="w-full mt-1">
                    <source src={url} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
