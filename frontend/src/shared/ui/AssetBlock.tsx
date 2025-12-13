import { type ReactNode } from "react"

type Props = {
  title: string
  filename?: string
  downloadUrl?: string
  children: ReactNode
}

export default function AssetBlock({
  title,
  filename,
  downloadUrl,
  children,
}: Props) {
  return (
    <div className="border border-slate-800 rounded-lg p-3 bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-slate-400 break-all">{filename}</p>
        </div>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="text-xs px-3 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white transition"
          >
            Download
          </a>
        )}
      </div>
      {children}
    </div>
  )
}
