import { useEffect, type ReactNode } from "react"

type Props = {
  open: boolean
  onClose: () => void
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export default function Modal({
  open,
  onClose,
  header,
  footer,
  children,
}: Props) {
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
      <div
        className="absolute inset-0 bg-black/80"
        aria-hidden
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />

      <div
        className="relative z-10 flex w-full max-w-3xl max-h-[900px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {header && (
          <header className="border-b border-slate-800 px-5 py-4">
            {header}
          </header>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <footer className="border-t border-slate-800 px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
