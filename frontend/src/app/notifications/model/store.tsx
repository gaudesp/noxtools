import {
  createContext,
  useContext,
  type ReactNode,
} from "react"
import { useNotificationState } from "./state"
import { NotificationList } from "../ui"

type NotificationsStore = {
  notify: (
    message: string,
    type?: "success" | "info" | "warning" | "danger"
  ) => void
}

const Store = createContext<NotificationsStore | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { items, notify, remove } = useNotificationState()

  return (
    <Store.Provider value={{ notify }}>
      {children}
      <NotificationList items={items} onClose={remove} />
    </Store.Provider>
  )
}

export function useNotifications() {
  const store = useContext(Store)
  if (!store) {
    throw new Error("useNotifications must be used within <NotificationsProvider>")
  }
  return store
}
