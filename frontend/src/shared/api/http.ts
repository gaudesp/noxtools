export class ApiError extends Error {
  readonly status?: number
  readonly details?: unknown

  constructor(message: string, status?: number, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with ${res.status}`
    let details: unknown = null

    try {
      const data = await res.json()
      details = data

      // FastAPI / Pydantic (422)
      if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
        message = data.detail[0].msg
      } else if (typeof data?.detail === "string") {
        message = data.detail
      }
    } catch {
      try {
        message = await res.text()
      } catch {}
    }

    throw new ApiError(message, res.status, details)
  }

  return res.json() as Promise<T>
}
