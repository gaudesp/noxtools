import { useState } from "react"
import {
  createNoxtubizerJob,
  type NoxtubizerCreateRequest,
} from "@/features/noxtubizer/api"

export const defaultNoxtubizerFormState: NoxtubizerCreateRequest = {
  url: "",
  mode: "audio",
  audio_quality: "high",
  audio_format: "mp3",
  video_quality: "best",
  video_format: "mp4",
}

interface Options {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export function useCreateNoxtubizerJob(options?: Options) {
  const [form, setForm] = useState(defaultNoxtubizerFormState)
  const [isSubmitting, setSubmitting] = useState(false)
  const [formError, setError] = useState<string | null>(null)

  async function submit() {
    try {
      setSubmitting(true)
      setError(null)

      const trimmed = form.url.trim()
      if (!trimmed) {
        setError("Please paste a valid YouTube URL.")
        return
      }

      await createNoxtubizerJob({ ...form, url: trimmed })

      if (options?.onSuccess) options.onSuccess()

      setForm((prev) => ({ ...prev, url: "" }))
    } catch (err) {
      console.error(err)
      setError("Form submit failed. Please retry.")
      if (options?.onError) options.onError(err)
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
    formError,
    isSubmitting,
    resetForm,
  }
}
