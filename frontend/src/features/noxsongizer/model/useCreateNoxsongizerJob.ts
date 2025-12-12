import { useState } from "react"
import {
  createNoxsongizerJob,
  type NoxsongizerCreateRequest,
} from "@/features/noxsongizer/api"

export const defaultNoxsongizerFormState: NoxsongizerCreateRequest = {
  files: [],
}

interface Options {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export function useCreateNoxsongizerJob(options?: Options) {
  const [form, setForm] = useState<NoxsongizerCreateRequest>(
    defaultNoxsongizerFormState,
  )
  const [isSubmitting, setSubmitting] = useState(false)
  const [formError, setError] = useState<string | null>(null)

  async function submit() {
    try {
      setSubmitting(true)
      setError(null)

      if (!form.files || form.files.length === 0) {
        setError("Please upload at least one track.")
        return
      }

      await createNoxsongizerJob(form)

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

  function updateForm(payload: Partial<NoxsongizerCreateRequest>) {
    setForm((prev) => ({ ...prev, ...payload }))
  }

  function resetForm() {
    setForm({ files: [] })
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
