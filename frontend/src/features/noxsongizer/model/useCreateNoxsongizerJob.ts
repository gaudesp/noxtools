import { useState } from "react"
import { createNoxsongizerJob, type NoxsongizerCreateRequest } from "../api"
import type { SubmitResult } from "@/shared/lib/useFormSubmit"

export const defaultNoxsongizerFormState: NoxsongizerCreateRequest = {
  files: [],
}

export function useCreateNoxsongizerJob() {
  const [form, setForm] = useState<NoxsongizerCreateRequest>(defaultNoxsongizerFormState)
  const [isSubmitting, setSubmitting] = useState(false)

  async function submit(): Promise<SubmitResult> {
    setSubmitting(true)

    try {
      if (!form.files.length) {
        return { status: "invalid", message: "Please upload at least one audio file." }
      }

      await createNoxsongizerJob(form)
      setForm(defaultNoxsongizerFormState)
      return { status: "success" }
    } catch (err) {
      return { status: "error", error: err }
    } finally {
      setSubmitting(false)
    }
  }

  function updateForm(payload: Partial<NoxsongizerCreateRequest>) {
    setForm((prev) => ({ ...prev, ...payload }))
  }

  function resetForm() {
    setForm(defaultNoxsongizerFormState)
  }

  return {
    form,
    updateForm,
    submit,
    resetForm,
    isSubmitting,
  }
}
