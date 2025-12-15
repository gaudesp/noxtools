type Props = {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center text-center">
      <div
        className="absolute inset-0 bg-black/80"
        role="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation()
          onCancel()
        }}
      />

      <div
        className="relative z-10 w-full max-w-sm rounded-lg border border-slate-800 bg-slate-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-sm font-semibold text-white">
          {title}
        </h3>

        {message && (
          <p className="mb-4 text-xs text-slate-300">
            {message}
          </p>
        )}

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-200 transition hover:border-slate-500"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className="rounded bg-rose-600 px-3 py-1 text-xs text-white transition hover:bg-rose-700"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
