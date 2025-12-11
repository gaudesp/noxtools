import { type NoxtubizerCreateRequest } from "../../api/api"

const audioQualityOptions: Array<{ value: NoxtubizerCreateRequest["audio_quality"]; label: string }> = [
  { value: "high", label: "Best available" },
  { value: "320kbps", label: "320 kbps" },
  { value: "256kbps", label: "256 kbps" },
  { value: "128kbps", label: "128 kbps" },
  { value: "64kbps", label: "64 kbps" },
]

const audioFormatOptions: Array<{ value: NonNullable<NoxtubizerCreateRequest["audio_format"]>; label: string }> = [
  { value: "mp3", label: "MP3" },
  { value: "m4a", label: "M4A" },
  { value: "ogg", label: "OGG" },
  { value: "wav", label: "WAV" },
]

type Props = {
  audioFormat: NonNullable<NoxtubizerCreateRequest["audio_format"]>
  audioQuality: NoxtubizerCreateRequest["audio_quality"]
  onChange: (
    payload: Partial<Pick<NoxtubizerCreateRequest, "audio_format" | "audio_quality">>,
  ) => void
}

export default function AudioSelector({ audioFormat, audioQuality, onChange }: Props) {
  const isWav = audioFormat === "wav"

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Audio quality</label>
        <select
          value={audioQuality}
          onChange={(e) => onChange({ audio_quality: e.target.value as NoxtubizerCreateRequest["audio_quality"] })}
          disabled={isWav}
          className={[
            "w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none",
            isWav ? "opacity-60 cursor-not-allowed" : "",
          ].join(" ")}
        >
          {audioQualityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Audio format</label>
        <select
          value={audioFormat}
          onChange={(e) => {
            const nextFormat = e.target.value as NoxtubizerCreateRequest["audio_format"]
            onChange({
              audio_format: nextFormat,
              audio_quality: nextFormat === "wav" ? "high" : audioQuality,
            })
          }}
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        >
          {audioFormatOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
