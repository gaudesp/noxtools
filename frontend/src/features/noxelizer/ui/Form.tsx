import { useState } from "react"
import Section from "@/shared/ui/Section"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import SubmitButton from "@/shared/ui/SubmitButton"
import ResetButton from "@/shared/ui/ResetButton"
import { useCreateNoxelizerJob } from "../model"
import { ImageUploadField } from "./form"

export default function Form() {
  const {
    updateForm,
    submit,
    formError,
    isSubmitting,
    resetForm,
  } = useCreateNoxelizerJob()

  const [files, setFiles] = useState<File[]>([])

  function handleFilesChange(next: File[]) {
    setFiles(next)
    updateForm({ files: next })
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

        <ImageUploadField
          files={files}
          disabled={isSubmitting}
          onChange={handleFilesChange}
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
