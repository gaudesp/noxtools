import { type ReactNode } from "react"

type Props = {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  padded?: boolean
}

export default function SectionCard({
  title,
  description,
  actions,
  children,
  padded = true,
}: Props) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
      {(title || description || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div>
            {title && <h2 className="text-base font-semibold text-white">{title}</h2>}
            {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  )
}
