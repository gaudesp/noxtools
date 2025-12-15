import { useState } from "react"
import { Section } from "@/shared/ui"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import { SubmitButton, ResetButton } from "@/shared/ui"
import { useFormSubmit } from "@/shared/lib/useFormSubmit"
import { useCreateNoxelizerJob } from "../model"
import { ImageUploadField } from "./form"

export default function Form() {
  const { submit, updateForm, resetForm, isSubmitting } =
    useCreateNoxelizerJob()
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
    <Section title="Upload your images">
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
