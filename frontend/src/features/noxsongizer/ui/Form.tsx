import { useState } from "react"
import { Section } from "@/app/layout"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import Uploader from "@/shared/ui/Uploader"
import SubmitButton from "@/shared/ui/SubmitButton"
import ResetButton from "@/shared/ui/ResetButton"
import { useCreateNoxsongizerJob } from "../model"

export default function NoxsongizerForm() {
  const {
    updateForm,
    submit,
    formError,
    isSubmitting,
    resetForm,
  } = useCreateNoxsongizerJob()

  const [files, setFiles] = useState<File[]>([])

  function handleUpload(selected: File[]) {
    setFiles(selected)
    updateForm({ files: selected })
  }

  async function handleSubmit() {
    await submit()
    setFiles([])
    resetForm()
  }

  function handleReset() {
    setFiles([])
    resetForm()
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

        <Uploader
          files={files}
          onUpload={handleUpload}
          busy={isSubmitting}
          accept="audio/*"
          title="Drag & drop audio files here"
          description="or click to choose one or multiple audio files from your computer"
          inputId="noxsongizer-uploader-input"
        />

        <div className="flex items-center justify-end gap-3">
          <ResetButton disabled={isSubmitting} onClick={handleReset} />
          <SubmitButton
            loading={isSubmitting}
            onClick={handleSubmit}
            label="Separate"
          />
        </div>
      </div>
    </Section>
  )
}
