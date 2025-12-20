import { useEffect, useMemo, useRef, useState } from "react"
import { CloseButton, Modal, NoticeMessage, Pagination, Spinner, SubmitButton } from "@/shared/ui"
import { getFileContentUrl, listFiles } from "../api"
import { cleanFileName, getFileSuffixToken } from "../lib"
import type { StoredFile } from "../model/types"

const PAGE_SIZE = 12
const DEFAULT_TYPES = ["all", "audio", "image", "video"]

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (files: StoredFile[]) => void
  selected?: StoredFile[]
  multiple?: boolean
  allowedTypes?: string[]
  title?: string
}

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes)) return "—"
  if (bytes < 1024) return `${bytes} b`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} kb`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} mb`
  const gb = mb / 1024
  return `${gb.toFixed(1)} gb`
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function buildSelectedMap(files: StoredFile[] | undefined): Map<string, StoredFile> {
  const map = new Map<string, StoredFile>()
  for (const file of files || []) {
    map.set(file.id, file)
  }
  return map
}

function getVideoVariant(file: StoredFile): "video" | "both" | "pixelate" {
  const lowered = file.name.trim().toLowerCase()
  if (lowered.startsWith("[both]")) return "both"
  const token = getFileSuffixToken(file.name)
  if (token === "both") return "both"
  if (token === "pixelate") return "pixelate"
  return "video"
}

function VideoPreviewIcon({ variant }: { variant: "video" | "both" | "pixelate" }) {
  if (variant === "both") {
    return (
      <svg className="w-7 h-7 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="14" height="12" rx="2" />
        <path d="M8 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none" />
        <path d="M19 9v6" />
        <path d="M22 10v4" />
      </svg>
    )
  }

  if (variant === "pixelate") {
    return (
      <svg className="w-7 h-7 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <rect x="7" y="9" width="2" height="2" fill="currentColor" stroke="none" />
        <rect x="11" y="11" width="2" height="2" fill="currentColor" stroke="none" />
        <rect x="15" y="9" width="2" height="2" fill="currentColor" stroke="none" />
        <rect x="9" y="13" width="2" height="2" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  return (
    <svg className="w-7 h-7 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M10 9.5l5 3-5 3z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function AudioPreviewIcon({ variant }: { variant: "audio" | "vocals" | "drums" | "bass" | "other" }) {
  if (variant === "vocals") {
    return (
      <svg className="w-7 h-7 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0014 0" />
        <path d="M12 18v3" />
        <path d="M8 21h8" />
      </svg>
    )
  }

  if (variant === "drums") {
    return (
      <svg className="w-7 h-7 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="8" rx="6" ry="3" />
        <path d="M6 8v6c0 1.7 2.7 3 6 3s6-1.3 6-3V8" />
        <path d="M4 4l3 3" />
        <path d="M20 4l-3 3" />
      </svg>
    )
  }

  if (variant === "bass") {
    return (
      <svg className="w-7 h-7 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18a3 3 0 006 0V7l6-2v11" />
        <circle cx="9" cy="18" r="3" />
        <circle cx="18" cy="16" r="2" />
      </svg>
    )
  }

  if (variant === "other") {
    return (
      <svg className="w-7 h-7 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16" />
        <path d="M4 17h16" />
        <circle cx="8" cy="7" r="2" />
        <circle cx="16" cy="17" r="2" />
      </svg>
    )
  }

  return (
    <svg className="w-7 h-7 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10v4" />
      <path d="M8 7v10" />
      <path d="M12 4v16" />
      <path d="M16 7v10" />
      <path d="M20 10v4" />
    </svg>
  )
}

function FilePreview({ file }: { file: StoredFile }) {
  const displayName = cleanFileName(file.name)
  if (file.type === "image") {
    return (
      <img
        src={getFileContentUrl(file.id, { variant: "thumb" })}
        alt={displayName || file.name}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    )
  }

  if (file.type === "audio") {
    const token = getFileSuffixToken(file.name)
    const variant =
      token === "vocals" || token === "drums" || token === "bass" || token === "other"
        ? token
        : "audio"
    return <AudioPreviewIcon variant={variant} />
  }

  if (file.type === "video") {
    const variant = getVideoVariant(file)
    return <VideoPreviewIcon variant={variant} />
  }

  return (
    <span className="text-[10px] text-slate-500 uppercase tracking-wide">
      File
    </span>
  )
}

export default function FileLibraryModal({
  open,
  onClose,
  onConfirm,
  selected,
  multiple = true,
  allowedTypes,
  title = "File library",
}: Props) {
  const allowedTypesKey = (allowedTypes || []).join("|")
  const normalizedAllowedTypes = useMemo(
    () => (allowedTypesKey ? allowedTypesKey.split("|") : []),
    [allowedTypesKey],
  )
  const defaultTypeFilter = normalizedAllowedTypes.length === 1 ? normalizedAllowedTypes[0] : "all"

  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState(defaultTypeFilter)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<StoredFile[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftSelected, setDraftSelected] = useState<Map<string, StoredFile>>(
    () => buildSelectedMap(selected),
  )
  const wasOpenRef = useRef(false)
  const lastRequestRef = useRef<string>("")

  const typeOptions = useMemo(() => {
    const options = new Set(DEFAULT_TYPES)
    for (const value of normalizedAllowedTypes) {
      options.add(value)
    }
    return Array.from(options)
  }, [allowedTypesKey, normalizedAllowedTypes])

  const restrictedNote = normalizedAllowedTypes.length
    ? `Selectable types: ${normalizedAllowedTypes.join(", ")}`
    : "Browse and select files across the library."

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setQuery("")
      setPage(1)
      setTypeFilter(
        normalizedAllowedTypes.length === 1 ? normalizedAllowedTypes[0] : "all",
      )
      setDraftSelected(buildSelectedMap(selected))
    }
    wasOpenRef.current = open
  }, [open, selected, normalizedAllowedTypes])

  useEffect(() => {
    if (!open) {
      lastRequestRef.current = ""
      return
    }
    const trimmed = query.trim()
    const requestKey = `${typeFilter}|${page}|${trimmed}`
    if (lastRequestRef.current === requestKey) return
    lastRequestRef.current = requestKey

    setLoading(true)
    setError(null)
    listFiles({
      q: trimmed.length ? trimmed : undefined,
      type: typeFilter !== "all" ? typeFilter : undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    })
      .then((payload) => {
        setItems(payload.items)
        setTotal(payload.total)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load files.")
      })
      .finally(() => setLoading(false))
  }, [open, query, typeFilter, page])

  function toggleSelection(file: StoredFile) {
    const canSelect = normalizedAllowedTypes.length === 0 || normalizedAllowedTypes.includes(file.type)
    if (!canSelect) return

    setDraftSelected((prev) => {
      const next = new Map(prev)
      if (!multiple) {
        next.clear()
        next.set(file.id, file)
        return next
      }
      if (next.has(file.id)) {
        next.delete(file.id)
      } else {
        next.set(file.id, file)
      }
      return next
    })
  }

  function handleConfirm() {
    onConfirm(Array.from(draftSelected.values()))
    onClose()
  }

  function handleClear() {
    setDraftSelected(new Map())
  }

  const selectedCount = draftSelected.size

  return (
    <Modal
      open={open}
      onClose={onClose}
      header={
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-white">{title}</p>
              <p className="text-xs text-slate-400">{restrictedNote}</p>
            </div>
            <CloseButton onClick={onClose} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search by name, type or label"
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none sm:max-w-xs"
            />

            <div className="flex flex-wrap gap-2">
              {typeOptions.map((option) => {
                const active = option === typeFilter
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setTypeFilter(option)
                      setPage(1)
                    }}
                    className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition ${
                      active
                        ? "border-violet-400 bg-violet-500/20 text-violet-100"
                        : "border-slate-700 text-slate-400 hover:border-violet-400/60 hover:text-slate-200"
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {selectedCount} file{selectedCount === 1 ? "" : "s"} selected
          </div>
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-white"
                onClick={handleClear}
              >
                Clear
              </button>
            )}
            <SubmitButton loading={false} onClick={handleConfirm} label="Use selection" />
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <NoticeMessage tone="danger" message={error} compact />}

        {loading && (
          <div className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
            <Spinner
              size="sm"
              label="Loading files..."
              className="text-slate-400"
              labelClassName="text-sm"
              ariaLabel="Loading files"
            />
          </div>
        )}

        {!error && items.length === 0 && !loading && (
          <NoticeMessage
            tone="warning"
            title="No files found"
            message="Try adjusting your search or filters."
            compact
          />
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {items.map((file) => {
            const isSelected = draftSelected.has(file.id)
            const isSelectable = normalizedAllowedTypes.length === 0 || normalizedAllowedTypes.includes(file.type)

            const displayType = file.type.toLowerCase()
            const sizeLabel = formatSize(file.size)
            const meta = `${displayType} • ${sizeLabel}`
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => toggleSelection(file)}
                disabled={!isSelectable}
                className={`text-left rounded-lg border px-4 py-3 transition ${
                  isSelected
                    ? "border-violet-500/80 bg-violet-500/15"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                } ${!isSelectable ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-md border border-slate-800 bg-slate-900/70 flex items-center justify-center overflow-hidden">
                    <FilePreview file={file} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {cleanFileName(file.name)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {meta}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Added {formatDate(file.created_at)}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="mt-1 rounded-full border border-violet-400/60 bg-violet-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-100">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <Pagination
          total={total}
          pageSize={PAGE_SIZE}
          currentPage={page}
          onPageChange={setPage}
          className="justify-end"
        />
      </div>
    </Modal>
  )
}
