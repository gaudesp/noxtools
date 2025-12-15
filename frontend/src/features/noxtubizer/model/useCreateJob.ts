import { useState } from "react"
import { createJob, type CreateRequest } from "../api"
import type { SubmitResult } from "@/shared/lib"

export const defaultForm: CreateRequest = {
  url: "",
  mode: "audio",
  audio_quality: "high",
  audio_format: "mp3",
  video_quality: "best",
  video_format: "mp4",
}

export function useCreateJob() {
  const [form, setForm] = useState<CreateRequest>(defaultForm)
  const [isSubmitting, setSubmitting] = useState(false)

  async function submit(): Promise<SubmitResult> {
    setSubmitting(true)

    try {
      const trimmed = form.url.trim()
      if (!trimmed) {
        return { status: "invalid", message: "Please paste a valid YouTube URL." }
      }

      await createJob({ ...form, url: trimmed })
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

  return {
    form,
    updateForm,
    submit,
    resetForm,
    isSubmitting,
  }
}
