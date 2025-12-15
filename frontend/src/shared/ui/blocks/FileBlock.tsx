import { type ReactNode } from "react"

type Props = {
  title: string
  subtitle?: string
  href?: string
  actionLabel?: string
  children: ReactNode
}

export default function FileBlock({
  title,
  subtitle,
  href,
  actionLabel = "Download",
  children,
}: Props) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle ? (
            <p className="break-all text-xs text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>

        {href ? (
          <a
            href={href}
            download
            className="rounded bg-violet-600 px-3 py-1 text-xs text-white transition hover:bg-violet-700"
          >
            {actionLabel}
          </a>
        ) : null}
      </div>

      {children}
    </div>
  )
}
