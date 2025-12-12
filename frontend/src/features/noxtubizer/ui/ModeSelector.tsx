import { type NoxtubizerMode } from "../api"

interface Option {
  value: NoxtubizerMode
  label: string
  description: string
}

const options: Option[] = [
  { value: "audio", label: "Audio", description: "Grab audio only" },
  { value: "video", label: "Video", description: "Grab video only" },
  { value: "both", label: "Both", description: "Merge best audio + video" },
]

export default function ModeSelector({
  mode,
  onChange,
}: {
  mode: NoxtubizerMode
  onChange: (m: NoxtubizerMode) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {options.map((o) => (
        <label
          key={o.value}
          className={`border rounded-md px-3 py-3 cursor-pointer transition ${
            mode === o.value
              ? "border-violet-500 shadow-[0_0_0_1px_rgba(139,92,246,0.4)]"
              : "border-slate-700 hover:border-violet-400"
          }`}
        >
          <input
            type="radio"
            value={o.value}
            checked={mode === o.value}
            onChange={() => onChange(o.value)}
            className="mr-2 accent-violet-500"
          />
          <div className="inline-flex flex-col">
            <span className="text-sm font-semibold">{o.label}</span>
            <span className="text-xs text-slate-400">{o.description}</span>
          </div>
        </label>
      ))}
    </div>
  )
}
