import { useState } from "react"
import { createJob, type CreateRequest } from "../api"
import type { SubmitResult } from "@/shared/lib"

export const defaultForm: CreateRequest = {
  files: [],
  file_ids: [],
}

export function useCreateJob() {
  const [form, setForm] = useState<CreateRequest>(defaultForm)
  const [isSubmitting, setSubmitting] = useState(false)

  async function submit(): Promise<SubmitResult> {
    setSubmitting(true)

    try {
      const hasFiles = Boolean(form.files?.length)
      const hasFileIds = Boolean(form.file_ids?.length)

      if (hasFiles && hasFileIds) {
        return { status: "invalid", message: "Choose either upload or library selection." }
      }
      if (!hasFiles && !hasFileIds) {
        return { status: "invalid", message: "Please upload or select at least one image." }
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
