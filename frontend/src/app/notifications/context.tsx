import {
  createContext,
  useContext,
  type ReactNode,
} from "react"
import { useNotificationState } from "./model"
import { NotificationList } from "./ui"

type NotificationsContextValue = {
  notify: (message: string, type?: "success" | "info" | "warning" | "danger") => void
}

const NotificationsContext =
  createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { items, notify, remove } = useNotificationState()

  return (
    <NotificationsContext.Provider value={{ notify }}>
      {children}
      <NotificationList items={items} onClose={remove} />
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider")
  }
  return ctx
}
