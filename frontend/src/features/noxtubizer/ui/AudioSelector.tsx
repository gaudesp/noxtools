import {
  type NoxtubizerAudioFormat,
  type NoxtubizerAudioQuality,
  type NoxtubizerCreateRequest,
} from "../api"

const audioQualityOptions: Array<{ value: NoxtubizerAudioQuality; label: string }> = [
  { value: "high", label: "Best available" },
  { value: "320kbps", label: "320 kbps" },
  { value: "256kbps", label: "256 kbps" },
  { value: "128kbps", label: "128 kbps" },
  { value: "64kbps", label: "64 kbps" },
]

const audioFormatOptions: Array<{ value: NoxtubizerAudioFormat; label: string }> = [
  { value: "mp3", label: "MP3" },
  { value: "m4a", label: "M4A" },
  { value: "ogg", label: "OGG" },
  { value: "wav", label: "WAV" },
]

interface Props {
  audioFormat: NoxtubizerAudioFormat
  audioQuality: NoxtubizerAudioQuality
  onChange: (payload: Partial<NoxtubizerCreateRequest>) => void
}

export default function AudioSelector({ audioFormat, audioQuality, onChange }: Props) {
  const isWav = audioFormat === "wav"

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Audio quality</label>
        <select
          value={audioQuality}
          onChange={(e) =>
            onChange({ audio_quality: e.target.value as NoxtubizerAudioQuality })
          }
          disabled={isWav}
          className={`w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm ${
            isWav ? "opacity-60 cursor-not-allowed" : "focus:border-violet-500"
          }`}
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
            const next = e.target.value as NoxtubizerAudioFormat
            onChange({
              audio_format: next,
              audio_quality: next === "wav" ? "high" : audioQuality,
            })
          }}
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-violet-500"
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
