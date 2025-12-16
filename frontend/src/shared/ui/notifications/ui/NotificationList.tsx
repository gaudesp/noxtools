import NotificationItem from "./NotificationItem"
import { type Notification } from "../model/types"

export default function NotificationList({
  items,
  onClose,
}: {
  items: Notification[]
  onClose: (id: string) => void
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-6 sm:justify-end sm:px-6 sm:pt-6">
      <div className="flex w-full max-w-sm flex-col gap-3">
        {items.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onClose={() => onClose(n.id)}
          />
        ))}
      </div>
    </div>
  )
}
