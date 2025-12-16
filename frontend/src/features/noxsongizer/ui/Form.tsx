import { useState } from "react"
import { Section, NoticeMessage, SubmitButton, ResetButton } from "@/shared/ui"
import { useCreateJob } from "../model"
import { AudioUploadField } from "./form"
import { useFormSubmit } from "@/shared/lib"

export default function Form() {
  const { submit, updateForm, resetForm, isSubmitting } = useCreateJob()
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

        <AudioUploadField
          files={files}
          disabled={isSubmitting}
          onChange={handleFilesChange}
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
