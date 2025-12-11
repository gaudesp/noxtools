import { type MouseEvent } from "react"

type Props = {
  open: boolean
  onCancel?: (event?: MouseEvent) => void
  onConfirm?: (event?: MouseEvent) => void
}

export default function DeleteConfirmModal({ open, onCancel, onConfirm }: Props) {
  if (!open) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-lg text-sm text-slate-200">
        <p className="mb-3">Delete this job?</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-violet-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-rose-600 px-3 py-1 text-xs text-white hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
