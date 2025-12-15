import { useMemo } from "react"
import { getSourceUrl, type NoxelizerJob } from "../api"

type Props = { job: NoxelizerJob }

export default function Preview({ job }: Props) {
  const source = useMemo(
    () => getSourceUrl(job.id),
    [job.id],
  )

  const hasSource = Boolean(job.input_path)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 overflow-hidden flex items-center justify-center"
    >
      {hasSource ? (
        <img
          src={source}
          alt={job.input_filename || "Original upload"}
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
