import { useNotifications } from "@/shared/ui"
import { ApiError } from "@/shared/api"

export type SubmitStatus = "success" | "invalid" | "error"

export type SubmitResult = {
  status: SubmitStatus
  message?: string
  error?: unknown
}

export function useFormSubmit() {
  const { notify } = useNotifications()

  function handleResult(
    result: SubmitResult,
    setFormError: (message: string | null) => void,
  ) {
    if (result.status === "invalid") {
      setFormError(result.message ?? "Form fields are invalid.")
      return
    }

    setFormError(null)

    if (result.status === "success") {
      notify(result.message ?? "Submitted successfully.", "success")
      return
    }

    if (result.status === "error") {
      const message =
        result.message ??
        (result.error instanceof ApiError
          ? result.error.message
          : "Something went wrong.")

      notify(message, "danger")
    }
  }

  return { handleResult }
}
