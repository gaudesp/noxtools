import { useCallback, useEffect, useRef, useState } from "react"
import { type Notification, type NotificationType } from "./types"

export function useNotificationState() {
  const [items, setItems] = useState<Notification[]>([])
  const timeouts = useRef<Record<string, number>>({})

  const remove = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, closing: true } : n)),
    )

    timeouts.current[id] = window.setTimeout(() => {
      setItems((prev) => prev.filter((n) => n.id !== id))
      window.clearTimeout(timeouts.current[id])
      delete timeouts.current[id]
    }, 400)
  }, [])

  const notify = useCallback(
    (message: string, type: NotificationType = "info") => {
      const id = crypto.randomUUID()
      setItems((prev) => [{ id, message, type }, ...prev])

      if (type === "success" || type === "info") {
        timeouts.current[id] = window.setTimeout(() => remove(id), 10_000)
      }
    },
    [remove],
  )

  useEffect(() => {
    return () => {
      Object.values(timeouts.current).forEach(clearTimeout)
      timeouts.current = {}
    }
  }, [])

  return { items, notify, remove }
}
