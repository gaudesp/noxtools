import { useState } from "react"
import { createNoxtunizerJob, type NoxtunizerCreateRequest } from "../api"
import type { SubmitResult } from "@/shared/lib"

export const defaultNoxtunizerFormState: NoxtunizerCreateRequest = {
  files: [],
}

export function useCreateNoxtunizerJob() {
  const [form, setForm] = useState<NoxtunizerCreateRequest>(defaultNoxtunizerFormState)
  const [isSubmitting, setSubmitting] = useState(false)

  async function submit(): Promise<SubmitResult> {
    setSubmitting(true)

    try {
      if (!form.files.length) {
        return { status: "invalid", message: "Please upload at least one audio file." }
      }

      await createNoxtunizerJob(form)
      setForm(defaultNoxtunizerFormState)
      return { status: "success" }
    } catch (err) {
      return { status: "error", error: err }
    } finally {
      setSubmitting(false)
    }
  }

  function updateForm(payload: Partial<NoxtunizerCreateRequest>) {
    setForm((prev) => ({ ...prev, ...payload }))
  }

  function resetForm() {
    setForm(defaultNoxtunizerFormState)
  }

  return {
    form,
    updateForm,
    submit,
    resetForm,
    isSubmitting,
  }
}
