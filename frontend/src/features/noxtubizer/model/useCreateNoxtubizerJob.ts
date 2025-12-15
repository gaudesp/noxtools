import { useState } from "react"
import { createNoxtubizerJob, type NoxtubizerCreateRequest } from "../api"
import type { SubmitResult } from "@/shared/lib"

export const defaultNoxtubizerFormState: NoxtubizerCreateRequest = {
  url: "",
  mode: "audio",
  audio_quality: "high",
  audio_format: "mp3",
  video_quality: "best",
  video_format: "mp4",
}

export function useCreateNoxtubizerJob() {
  const [form, setForm] = useState<NoxtubizerCreateRequest>(defaultNoxtubizerFormState)
  const [isSubmitting, setSubmitting] = useState(false)

  async function submit(): Promise<SubmitResult> {
    setSubmitting(true)

    try {
      const trimmed = form.url.trim()
      if (!trimmed) {
        return { status: "invalid", message: "Please paste a valid YouTube URL." }
      }

      await createNoxtubizerJob({ ...form, url: trimmed })
      setForm(defaultNoxtubizerFormState)
      return { status: "success" }
    } catch (err) {
      return { status: "error", error: err }
    } finally {
      setSubmitting(false)
    }
  }

  function updateForm(payload: Partial<NoxtubizerCreateRequest>) {
    setForm((prev) => ({ ...prev, ...payload }))
  }

  function resetForm() {
    setForm(defaultNoxtubizerFormState)
  }

  return {
    form,
    updateForm,
    submit,
    resetForm,
    isSubmitting,
  }
}
