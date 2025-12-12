import { useState } from "react"
import { Section } from "@/app/layout"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import Uploader from "@/shared/ui/Uploader"
import SubmitButton from "@/shared/ui/SubmitButton"
import ResetButton from "@/shared/ui/ResetButton"
import { useCreateNoxtunizerJob } from "@/features/noxtunizer/model"

export default function NoxtunizerForm() {
  const {
    updateForm,
    submit,
    formError,
    isSubmitting,
    resetForm,
  } = useCreateNoxtunizerJob()

  const [files, setFiles] = useState<File[]>([])

  function handleUpload(selected: File[]): void {
    setFiles(selected)
    updateForm({ files: selected })
  }

  function handleReset(): void {
    setFiles([])
    resetForm()
  }

  async function handleSubmit(): Promise<void> {
    await submit()
    handleReset()
  }

  return (
    <Section
      title="Upload your audio"
      description="Audio files are analyzed to extract BPM, key and duration."
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
          title="Drag & drop audio here"
          description="or click to choose one or multiple songs from your computer"
          inputId="noxtunizer-uploader-input"
        />

        <div className="flex items-center justify-end gap-3">
          <ResetButton disabled={isSubmitting} onClick={handleReset} />
          <SubmitButton loading={isSubmitting} onClick={handleSubmit} label="Analyze" />
        </div>
      </div>
    </Section>
  )
}
