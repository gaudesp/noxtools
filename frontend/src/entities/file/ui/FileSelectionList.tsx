import type { StoredFile } from "../model/types"
import { cleanFileName } from "../lib"

type Props = {
  files: StoredFile[]
  onRemove?: (file: StoredFile) => void
  emptyLabel?: string
}

export default function FileSelectionList({
  files,
  onRemove,
  emptyLabel,
}: Props) {
  if (!files.length) {
    if (!emptyLabel) return null
    return (
      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-400">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3 max-w-full">
      {files.map((file) => {
        const displayName = cleanFileName(file.name)
        return (
          <div
            key={file.id}
            className="flex items-center gap-2 bg-slate-800/70 px-3 py-1.5 rounded-md text-sm text-neutral-200 border border-slate-700 max-w-60"
          >
            <svg
              className="w-4 h-4 text-violet-300 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 3h8l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
              />
            </svg>

            <span className="truncate">{displayName || file.name}</span>
            {onRemove && (
              <button
                type="button"
                className="text-neutral-400 hover:text-red-400 transition"
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(file)
                }}
                aria-label={`Remove ${displayName || file.name}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
