import { type ReactNode } from "react"

type Props = {
  title?: string
  message: string
  details?: ReactNode
  tone?: "danger" | "warning" | "info"
  compact?: boolean
}

const TONES = {
  danger: "bg-rose-900/40 border-rose-700 text-rose-50",
  warning: "bg-amber-900/30 border-amber-700 text-amber-50",
  info: "bg-sky-900/30 border-sky-700 text-sky-50",
} as const

export default function ErrorMessage({
  title = "Something went wrong",
  message,
  details,
  tone = "danger",
  compact = false,
}: Props) {
  const toneClass = TONES[tone]

  return (
    <div
      className={[
        "w-full rounded-lg border px-4 py-3 shadow-inner",
        toneClass,
        compact ? "text-sm" : "text-base",
      ].join(" ")}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 h-2 w-2 rounded-full bg-white/70 ring-4 ring-white/20" aria-hidden />
        <div className="space-y-1">
          {title && <p className="font-semibold leading-tight">{title}</p>}
          <p className={compact ? "text-sm leading-snug" : "text-sm leading-relaxed"}>{message}</p>
          {details ? (
            <div className="text-xs leading-relaxed text-white/80 whitespace-pre-wrap">
              {details}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
