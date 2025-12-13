import { useState } from "react"
import { createNoxelizerJob, type NoxelizerCreateRequest } from "../api"
import type { SubmitResult } from "@/shared/lib/useFormSubmit"

export const defaultNoxelizerFormState: NoxelizerCreateRequest = {
  files: [],
}

export function useCreateNoxelizerJob() {
  const [form, setForm] = useState<NoxelizerCreateRequest>(defaultNoxelizerFormState)
  const [isSubmitting, setSubmitting] = useState(false)

  async function submit(): Promise<SubmitResult> {
    setSubmitting(true)

    try {
      if (!form.files.length) {
        return { status: "invalid", message: "Please upload at least one image." }
      }
      
      await createNoxelizerJob(form)
      setForm(defaultNoxelizerFormState)
      return { status: "success" }
    } catch (err) {
      return { status: "error", error: err }
    } finally {
      setSubmitting(false)
    }
  }

  function updateForm(payload: Partial<NoxelizerCreateRequest>) {
    setForm((prev) => ({ ...prev, ...payload }))
  }

  function resetForm() {
    setForm(defaultNoxelizerFormState)
  }

  return { submit, updateForm, resetForm, isSubmitting }
}
