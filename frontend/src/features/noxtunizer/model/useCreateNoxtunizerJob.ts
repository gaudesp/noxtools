import { useState } from "react"
import { createNoxtunizerJob, type NoxtunizerCreateRequest } from "../api"

export const defaultNoxtunizerFormState: NoxtunizerCreateRequest = {
  files: [],
}

interface Options {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export function useCreateNoxtunizerJob(options?: Options) {
  const [form, setForm] = useState<NoxtunizerCreateRequest>(
    defaultNoxtunizerFormState,
  )
  const [isSubmitting, setSubmitting] = useState(false)
  const [formError, setError] = useState<string | null>(null)

  async function submit(): Promise<void> {
    try {
      setSubmitting(true)
      setError(null)

      if (!form.files || form.files.length === 0) {
        setError("Please upload at least one audio file.")
        return
      }

      await createNoxtunizerJob(form)

      if (options?.onSuccess) options.onSuccess()

      setForm(defaultNoxtunizerFormState)
    } catch (err) {
      console.error(err)
      setError("Form submit failed. Please retry.")
      if (options?.onError) options.onError(err)
    } finally {
      setSubmitting(false)
    }
  }

  function updateForm(payload: Partial<NoxtunizerCreateRequest>): void {
    setForm((prev) => ({ ...prev, ...payload }))
  }

  function resetForm(): void {
    setForm(defaultNoxtunizerFormState)
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
