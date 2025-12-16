import { type ReactNode } from "react"

type Props = {
  title: string
  description: string
  eyebrow?: string
  eyebrowClassName?: string
  actions?: ReactNode
}

export default function Header({ title, description, eyebrow, eyebrowClassName, actions }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {eyebrow ? (
        <div className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] uppercase tracking-wide ring-1 ring-inset w-max ${eyebrowClassName ?? "border-white/20 bg-white/10 text-white ring-white/20"}`}>
          {eyebrow}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white leading-tight">{title}</h1>
          <p className="text-sm text-slate-400 max-w-3xl">{description}</p>
        </div>

        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
