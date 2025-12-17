import { Tag } from "@/shared/ui"
import type { JobStatus } from "../model/types"

type Tone = "warning" | "info" | "success" | "danger" | "neutral"

type JobDateTagProps = {
  date?: string | null
  tone: Tone
  className?: string
  label?: string
}

type JobDateTagsProps = {
  createdAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  status?: JobStatus
  className?: string
}

const TONE_CLASSNAMES: Record<Tone, string> = {
  warning: "border-amber-400/50 bg-amber-500/15 text-amber-100",
  info: "border-sky-400/50 bg-sky-500/15 text-sky-100",
  success: "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
  danger: "border-rose-400/50 bg-rose-500/15 text-rose-100",
  neutral: "border-slate-400/50 bg-slate-500/15 text-slate-100",
}

const ALIGN_CLASSNAMES = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
}

function formatJobDate(iso?: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleString()
}

export function JobDateTag({
  date,
  tone,
  className = "",
  label,
}: JobDateTagProps) {
  const formatted = formatJobDate(date)
  if (!formatted) {
    return (
      <Tag className={`${TONE_CLASSNAMES.neutral} flex w-full justify-center text-center font-normal whitespace-nowrap ${className}`.trim()}>
        {label ? `${label} —` : "—"}
      </Tag>
    )
  }

  return (
    <Tag className={`${TONE_CLASSNAMES[tone]} flex w-full justify-center text-center font-normal whitespace-nowrap ${className}`.trim()}>
      {label ? `${label} ${formatted}` : formatted}
    </Tag>
  )
}

export default function JobDateTags({
  createdAt,
  startedAt,
  completedAt,
  status,
  className = "",
}: JobDateTagsProps) {
  const slots: Array<{
    date?: string | null
    tone: Tone
    align: "start" | "center" | "end"
    label: string
  }> = [
    { date: createdAt, tone: "warning", align: "start", label: "Created :" },
    { date: startedAt, tone: "info", align: "center", label: "Started :" },
    {
      date: completedAt,
      tone: status === "error" ? "danger" : "success",
      align: "end",
      label: "Completed :",
    },
  ]

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`.trim()}>
      {slots.map(({ date, tone, align, label }) => (
        <div
          key={tone}
          className={`flex ${ALIGN_CLASSNAMES[align]}`}
        >
          <JobDateTag
            date={date}
            tone={tone}
            label={label}
          />
        </div>
      ))}
    </div>
  )
}
