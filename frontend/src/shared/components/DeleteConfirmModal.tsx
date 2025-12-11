import type { MouseEvent } from "react"

type Props = {
  open: boolean
  onCancel: (e?: MouseEvent) => void
  onConfirm: (e?: MouseEvent) => void
}

export default function DeleteConfirmModal({ open, onCancel, onConfirm }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center text-center">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative w-full max-w-sm rounded-xl border border-rose-800/60 bg-slate-950 px-6 py-5 text-left shadow-xl">
        <h2 className="text-sm font-semibold text-rose-50">
          Delete selected jobs?
        </h2>
        <p className="mt-2 text-xs text-slate-300">
          This will permanently remove the selected jobs and their results from NoxTools.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800 transition"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-rose-600 px-3 py-1 text-xs text-white transition hover:bg-rose-700"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
