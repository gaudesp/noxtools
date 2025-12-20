import { useMemo } from "react"
import { cleanFileName } from "@/entities/file"
import { getSourceUrl, type NoxelizerJob } from "../api"

type Props = { job: NoxelizerJob }

export default function Preview({ job }: Props) {
  const source = useMemo(
    () => getSourceUrl(job.id, { variant: "thumb" }),
    [job.id],
  )

  const inputName =
    job.input_filename ||
    job.result?.files?.find((item) => item.role === "input")?.file.name ||
    null
  const displayName = cleanFileName(inputName)
  const hasSource = Boolean(inputName)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 overflow-hidden flex items-center justify-center"
    >
      {hasSource ? (
        <img
          src={source}
          alt={displayName || inputName || "Original upload"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">
          N/A
        </span>
      )}
    </div>
  )
}
