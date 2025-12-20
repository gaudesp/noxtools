import { Spinner } from "@/shared/ui"
import FileSelectionList from "./FileSelectionList"
import type { StoredFile } from "../model/types"

type Props = {
  files: StoredFile[]
  onBrowse: () => void
  onRemoveFile?: (file: StoredFile) => void
  busy?: boolean
  title?: string
  description?: string
  busyLabel?: string
}

export default function FileLibraryField({
  files,
  onBrowse,
  onRemoveFile,
  busy = false,
  title = "Browse the file library",
  description = "or click to choose one or multiple files from your library",
  busyLabel = "Loading...",
}: Props) {
  return (
    <div className="w-full">
      <div
        className={[
          "flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-6 py-12 cursor-pointer transition relative",
          "border-slate-700 bg-slate-950 hover:border-violet-500 hover:bg-slate-900/40",
          busy ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
        onClick={() => {
          if (!busy) onBrowse()
        }}
      >
        {!busy && (
          <>
            <p className="text-lg font-semibold text-neutral-200">{title}</p>
            <p className="text-sm text-neutral-400">{description}</p>
          </>
        )}

        {busy && (
          <Spinner
            size="sm"
            label={busyLabel}
            className="text-neutral-300"
            labelClassName="text-sm"
            ariaLabel={busyLabel}
          />
        )}

        <FileSelectionList files={files} onRemove={onRemoveFile} />
      </div>
    </div>
  )
}
