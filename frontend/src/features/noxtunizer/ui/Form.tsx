import { useState } from "react"
import { Section, NoticeMessage, SubmitButton, ResetButton } from "@/shared/ui"
import { useFormSubmit } from "@/shared/lib"
import { useCreateJob } from "../model"
import { AudioUploadField } from "./form"

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
            label="Analyze"
          />
        </div>
      </div>
    </Section>
  )
}
