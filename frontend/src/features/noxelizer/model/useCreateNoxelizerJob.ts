import { useState } from "react"
import { createNoxelizerJob, type NoxelizerCreateRequest } from "../api"

export const defaultNoxelizerFormState: NoxelizerCreateRequest = {
  files: [],
}

interface Options {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export function useCreateNoxelizerJob(options?: Options) {
  const [form, setForm] = useState<NoxelizerCreateRequest>(defaultNoxelizerFormState)
  const [isSubmitting, setSubmitting] = useState(false)
  const [formError, setError] = useState<string | null>(null)

  async function submit() {
    try {
      setSubmitting(true)
      setError(null)

      if (!form.files || form.files.length === 0) {
        setError("Please upload at least one image.")
        return
      }

      await createNoxelizerJob(form)

      if (options?.onSuccess) options.onSuccess()

      setForm({ files: [] })
    } catch (err) {
      console.error(err)
      setError("Form submit failed. Please retry.")
      if (options?.onError) options.onError(err)
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

  return {
    form,
    updateForm,
    submit,
    formError,
    isSubmitting,
    resetForm,
  }
}
