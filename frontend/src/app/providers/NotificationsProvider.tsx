import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

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

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notification[]>([])
  const timeouts = useRef<Record<string, number>>({})

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, closing: true } : n)))
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
        timeouts.current[id] = window.setTimeout(() => remove(id), 10000)
      }
    },
    [remove],
  )

  useEffect(() => {
    return () => {
      Object.values(timeouts.current).forEach((t) => window.clearTimeout(t))
      timeouts.current = {}
    }
  }, [])

  const value = useMemo(
    () => ({
      notify,
    }),
    [notify],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-6 sm:justify-end sm:px-6 sm:pt-6">
        <div className="flex w-full max-w-sm flex-col gap-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={[
                "pointer-events-auto transform rounded-xl border px-4 py-3 shadow-lg transition-all duration-300",
                n.closing ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
                n.type === "success"
                  ? "border-emerald-600 bg-emerald-900/80 text-emerald-100"
                  : n.type === "info"
                    ? "border-sky-600 bg-sky-900/80 text-sky-100"
                    : n.type === "warning"
                      ? "border-amber-600 bg-amber-900/80 text-amber-100"
                      : "border-rose-600 bg-rose-900/80 text-rose-100",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm leading-snug">{n.message}</div>
                <button
                  type="button"
                  className="px-1 text-lg leading-none text-slate-200 hover:text-white"
                  aria-label="Close notification"
                  onClick={() => remove(n.id)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </NotificationsContext.Provider>
  )
}
