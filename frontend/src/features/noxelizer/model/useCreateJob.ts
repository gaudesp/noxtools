import { useState } from "react"
import { createJob, type CreateRequest } from "../api"
import type { SubmitResult } from "@/shared/lib"

export const defaultForm: CreateRequest = {
  files: [],
}

export function useCreateJob() {
  const [form, setForm] = useState<CreateRequest>(defaultForm)
  const [isSubmitting, setSubmitting] = useState(false)

  async function submit(): Promise<SubmitResult> {
    setSubmitting(true)

    try {
      if (!form.files.length) {
        return { status: "invalid", message: "Please upload at least one image." }
      }
      
      await createJob(form)
      setForm(defaultForm)
      return { status: "success" }
    } catch (err) {
      return { status: "error", error: err }
    } finally {
      setSubmitting(false)
    }
  }

  function updateForm(payload: Partial<CreateRequest>) {
    setForm((prev) => ({ ...prev, ...payload }))
  }

  function resetForm() {
    setForm(defaultForm)
  }

  return { submit, updateForm, resetForm, isSubmitting }
}
