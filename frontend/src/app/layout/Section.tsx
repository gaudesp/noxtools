import { type ReactNode } from "react"

type Props = {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  padded?: boolean
}

export default function Section({
  title,
  description,
  actions,
  children,
  padded = true,
}: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-md">
      {(title || description || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div>
            {title ? (
              <h2 className="text-base font-semibold text-white">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>
        {children}
      </div>
    </section>
  )
}
