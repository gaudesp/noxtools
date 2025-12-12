import { useState } from "react"
import { Section } from "@/app/layout"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import Uploader from "@/shared/ui/Uploader"
import SubmitButton from "@/shared/ui/SubmitButton"
import ResetButton from "@/shared/ui/ResetButton"
import { useCreateNoxelizerJob } from "../model"

export default function Form() {
  const {
    updateForm,
    submit,
    formError,
    isSubmitting,
    resetForm,
  } = useCreateNoxelizerJob()

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
      title="Upload your images"
      description="Images are animated into a depixelization video. Upload one or multiple files."
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
          accept="image/*"
          title="Drag & drop images here"
          description="or click to choose one or multiple images from your computer"
          inputId="noxelizer-uploader-input"
        />

        <div className="flex items-center justify-end gap-3">
          <ResetButton disabled={isSubmitting} onClick={handleReset} />
          <SubmitButton
            loading={isSubmitting}
            onClick={handleSubmit}
            label="Generate"
          />
        </div>
      </div>
    </Section>
  )
}
