import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

export type NotificationType = "success" | "info" | "warning" | "danger"

export type Notification = {
  id: string
  message: string
  type: NotificationType
  closing?: boolean
}

type NotificationsContextValue = {
  notify: (message: string, type?: NotificationType) => void
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider")
  }
  return ctx
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
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

  const notify = useCallback((message: string, type: NotificationType = "info") => {
    const id = crypto.randomUUID()
    setItems((prev) => [{ id, message, type }, ...prev])
    if (type === "success" || type === "info") {
      timeouts.current[id] = window.setTimeout(() => remove(id), 10000)
    }
  }, [remove])

  useEffect(() => {
    return () => {
      Object.values(timeouts.current).forEach((t) => window.clearTimeout(t))
    }
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-4">
        {items.map((n) => (
          <div
            key={n.id}
            className={[
              "w-72 rounded-md px-4 py-3 shadow-lg border transition-all duration-400 transform",
              n.closing ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
              n.type === "success" ? "bg-emerald-900/80 border-emerald-600 text-emerald-100" :
              n.type === "info" ? "bg-sky-900/80 border-sky-600 text-sky-100" :
              n.type === "warning" ? "bg-amber-900/80 border-amber-600 text-amber-100" :
              "bg-rose-900/80 border-rose-600 text-rose-100",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm leading-snug">{n.message}</div>
              <button
                type="button"
                className="text-lg text-slate-200 hover:text-white px-1 leading-none"
                aria-label="Close notification"
                onClick={() => remove(n.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  )
}
