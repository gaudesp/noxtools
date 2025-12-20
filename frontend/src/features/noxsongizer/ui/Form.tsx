import { useState } from "react"
import { Section, NoticeMessage, SubmitButton, ResetButton } from "@/shared/ui"
import { FileLibraryModal, FileLibraryField, type StoredFile } from "@/entities/file"
import { useCreateJob } from "../model"
import { AudioUploadField } from "./form"
import { useFormSubmit } from "@/shared/lib"

export default function Form() {
  const { submit, updateForm, resetForm, isSubmitting } = useCreateJob()
  const { handleResult } = useFormSubmit()

  const [files, setFiles] = useState<File[]>([])
  const [selectedFiles, setSelectedFiles] = useState<StoredFile[]>([])
  const [sourceMode, setSourceMode] = useState<"upload" | "library">("upload")
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function handleFilesChange(next: File[]) {
    setFiles(next)
    updateForm({ files: next, file_ids: [] })
  }

  function handleLibraryConfirm(selection: StoredFile[]) {
    setSourceMode("library")
    setSelectedFiles(selection)
    updateForm({ file_ids: selection.map((file) => file.id), files: [] })
  }

  function handleRemoveSelected(file: StoredFile) {
    const next = selectedFiles.filter((item) => item.id !== file.id)
    setSelectedFiles(next)
    updateForm({ file_ids: next.map((item) => item.id) })
  }

  async function handleSubmit() {
    const result = await submit()
    handleResult(result, setFormError)
    if (result.status === "success") {
      setFiles([])
      setSelectedFiles([])
    }
  }

  function handleReset() {
    setFiles([])
    setSelectedFiles([])
    setSourceMode("upload")
    setLibraryOpen(false)
    resetForm()
    setFormError(null)
  }

  return (
    <Section
      title="Upload your tracks"
      description="Songs are separated into high-quality audio stems. Upload one or multiple files."
    >
      <div className="space-y-5">
        {formError && (
          <NoticeMessage
            title="Invalid request"
            message={formError}
            tone="danger"
            compact
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSourceMode("upload")
              setSelectedFiles([])
              updateForm({ file_ids: [] })
            }}
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition ${
              sourceMode === "upload"
                ? "border-violet-400 bg-violet-500/20 text-violet-100"
                : "border-slate-700 text-slate-400 hover:border-violet-400/60 hover:text-slate-200"
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => {
              setSourceMode("library")
              setFiles([])
              updateForm({ files: [] })
            }}
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition ${
              sourceMode === "library"
                ? "border-violet-400 bg-violet-500/20 text-violet-100"
                : "border-slate-700 text-slate-400 hover:border-violet-400/60 hover:text-slate-200"
            }`}
          >
            Library
          </button>
        </div>

        {sourceMode === "upload" ? (
          <AudioUploadField
            files={files}
            disabled={isSubmitting}
            onChange={handleFilesChange}
          />
        ) : (
          <FileLibraryField
            files={selectedFiles}
            onBrowse={() => setLibraryOpen(true)}
            onRemoveFile={handleRemoveSelected}
            busy={isSubmitting}
            title="Browse audio library"
            description="or click to choose one or multiple audio files from your library"
          />
        )}

        <div className="flex items-center justify-end gap-3">
          <ResetButton disabled={isSubmitting} onClick={handleReset} />
          <SubmitButton
            loading={isSubmitting}
            onClick={handleSubmit}
            label="Separate"
          />
        </div>
      </div>

      <FileLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onConfirm={handleLibraryConfirm}
        selected={selectedFiles}
        allowedTypes={["audio"]}
        title="Select audio files"
      />
    </Section>
  )
}
