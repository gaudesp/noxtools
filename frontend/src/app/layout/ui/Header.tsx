import { type ReactNode } from "react"

type Props = {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
}

export default function Header({ title, description, eyebrow, actions }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {eyebrow ? (
        <div className="inline-flex items-center rounded-full bg-violet-500/10 px-3 py-1 text-[11px] uppercase tracking-wide text-violet-200 ring-1 ring-inset ring-violet-400/30 w-max">
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
