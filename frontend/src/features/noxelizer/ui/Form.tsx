import { useState } from "react"
import { Section, SubmitButton, ResetButton, NoticeMessage } from "@/shared/ui"
import { useFormSubmit } from "@/shared/lib"
import { useCreateJob } from "../model"
import { ImageUploadField } from "./form"

export default function Form() {
  const { submit, updateForm, resetForm, isSubmitting } =
    useCreateJob()
  const { handleResult } = useFormSubmit()

  const [files, setFiles] = useState<File[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  function handleFilesChange(next: File[]) {
    setFiles(next)
    updateForm({ files: next })
  }

  async function handleSubmit() {
    const result = await submit()
    handleResult(result, setFormError)
    if (result.status === "success") setFiles([])
  }

  function handleReset() {
    setFiles([])
    resetForm()
    setFormError(null)
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

        <div className="flex justify-end gap-3">
          <ResetButton disabled={isSubmitting} onClick={handleReset} />
          <SubmitButton label="Generate" loading={isSubmitting} onClick={handleSubmit} />
        </div>
      </div>
    </Section>
  )
}
