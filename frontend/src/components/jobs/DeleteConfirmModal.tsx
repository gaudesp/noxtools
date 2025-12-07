import type { MouseEvent } from "react"

type Props = {
  open: boolean
  onCancel: (e?: MouseEvent) => void
  onConfirm: (e?: MouseEvent) => void
}

export default function DeleteConfirmModal({ open, onCancel, onConfirm }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onCancel}
        role="button"
        tabIndex={-1}
      />
      <div className="relative z-10 w-full max-w-sm bg-slate-950 border border-rose-700 rounded-lg shadow-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-2">Delete job?</h3>
        <p className="text-xs text-slate-300 mb-4">
          This will remove the job and its related files.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="text-xs px-3 py-1 rounded border border-slate-700 text-slate-200 hover:border-slate-500 transition"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="text-xs px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white transition"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
