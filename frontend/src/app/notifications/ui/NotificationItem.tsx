import { type Notification } from "../model"

export default function NotificationItem({
  notification,
  onClose,
}: {
  notification: Notification
  onClose: () => void
}) {
  const { message, type, closing } = notification

  const base =
    "pointer-events-auto transform rounded-xl border px-4 py-3 shadow-lg transition-all duration-300"

  const style =
    type === "success"
      ? "border-emerald-600 bg-emerald-900/80 text-emerald-100"
      : type === "info"
        ? "border-sky-600 bg-sky-900/80 text-sky-100"
        : type === "warning"
          ? "border-amber-600 bg-amber-900/80 text-amber-100"
          : "border-rose-600 bg-rose-900/80 text-rose-100"

  return (
    <div
      className={[
        base,
        style,
        closing ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm leading-snug">{message}</div>
        <button
          type="button"
          className="px-1 text-lg leading-none"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  )
}
