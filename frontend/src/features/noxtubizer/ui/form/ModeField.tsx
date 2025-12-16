import { type Mode } from "../../api"

interface Option {
  value: Mode
  label: string
  description: string
}

const options: Option[] = [
  { value: "audio", label: "Audio", description: "Grab audio only" },
  { value: "video", label: "Video", description: "Grab video only" },
  { value: "both", label: "Both", description: "Merge best audio + video" },
]

type Props = {
  value: Mode
  onChange: (mode: Mode) => void
}

export default function ModeField({ value, onChange }: Props) {
  return (
    <div>
      <p className="block text-sm font-semibold mb-2">Mode</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((o) => {
          const id = `mode-${o.value}`

          return (
            <label
              key={o.value}
              htmlFor={id}
              className={`border rounded-md px-3 py-3 cursor-pointer transition ${
                value === o.value
                  ? "border-violet-500 shadow-[0_0_0_1px_rgba(139,92,246,0.4)]"
                  : "border-slate-700 hover:border-violet-400"
              }`}
            >
              <input
                id={id}
                name="mode"
                type="radio"
                checked={value === o.value}
                onChange={() => onChange(o.value)}
                className="mr-2 accent-violet-500"
              />
              <div className="inline-flex flex-col">
                <span className="text-sm font-semibold">{o.label}</span>
                <span className="text-xs text-slate-400">{o.description}</span>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
