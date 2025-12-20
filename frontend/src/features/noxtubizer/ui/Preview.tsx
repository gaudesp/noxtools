import type { ReactNode } from "react"
import type { NoxtubizerJob, Mode } from "../api/types"

type Props = { job: NoxtubizerJob }

export default function Preview({ job }: Props) {
  const mode = job.result?.summary?.mode ?? job.params?.mode
  if (!mode) return null

  const palette: Record<Mode, {
    wrapper: string
    label: string
    icon: ReactNode
  }> = {
    audio: {
      wrapper: "border-emerald-400/60 bg-emerald-500/15 text-emerald-100",
      label: "Audio",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
          <path d="M9 18a3 3 0 1 1-3-3" />
          <path d="M9 18V6l11-2v10" />
          <path d="M20 14a3 3 0 1 1-3-3" />
        </svg>
      ),
    },
    video: {
      wrapper: "border-sky-400/60 bg-sky-500/15 text-sky-100",
      label: "Video",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
          <rect x="3" y="5" width="14" height="14" rx="2" />
          <path d="m17 9 4-2v10l-4-2" />
        </svg>
      ),
    },
    both: {
      wrapper: "border-amber-400/70 bg-amber-500/15 text-amber-100",
      label: "Both",
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
          <rect x="3" y="4" width="13" height="12" rx="2" />
          <path d="m16 8 4-3v10l-4-3" />
          <path d="M7 18h10" />
          <path d="M10 21h4" />
        </svg>
      ),
    },
  }

  const selected = palette[mode]

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-inner ${selected.wrapper}`}
      title={selected.label}
      aria-label={selected.label}
    >
      {selected.icon}
    </div>
  )
}
