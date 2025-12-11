import { type ReactNode } from "react"

type Tone = "success" | "danger" | "warning" | "info"

type Props = {
  title?: string
  message: string
  details?: ReactNode
  tone?: Tone
  compact?: boolean
  withSpinner?: boolean
}

const TONE_STYLES: Record<Tone, string> = {
  success: "bg-emerald-900/30 border-emerald-700 text-emerald-50",
  danger: "bg-rose-900/40 border-rose-700 text-rose-50",
  warning: "bg-amber-900/35 border-amber-700 text-amber-50",
  info: "bg-sky-900/30 border-sky-700 text-sky-50",
}

const ICONS: Record<Tone, JSX.Element> = {
  success: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  danger: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
      <path d="m3.5 19 8.5-14 8.5 14Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" strokeLinecap="round" />
      <circle cx="12" cy="7" r="1.2" fill="currentColor" />
    </svg>
  ),
}

export default function NoticeMessage({
  title,
  message,
  details,
  tone = "info",
  compact = false,
  withSpinner = false,
}: Props) {
  const toneClass = TONE_STYLES[tone]
  const textSize = compact ? "text-sm" : "text-base"

  return (
    <div
      className={[
        "w-full rounded-lg border px-4 py-3 shadow-inner",
        toneClass,
        textSize,
      ].join(" ")}
      role={tone === "danger" ? "alert" : "status"}
    >
      <div className="flex items-center gap-3">
        <div className="text-current" aria-hidden>
          {ICONS[tone]}
        </div>
        <div className="space-y-1">
          {title ? <p className="font-semibold leading-tight">{title}</p> : null}
          <p className={compact ? "text-sm leading-snug flex items-center gap-2" : "text-sm leading-relaxed flex items-center gap-2"}>
            <span>{message}</span>
            {withSpinner ? (
              <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
            ) : null}
          </p>
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
