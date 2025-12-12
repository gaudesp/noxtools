import {
  type NoxtubizerVideoFormat,
  type NoxtubizerVideoQuality,
  type NoxtubizerCreateRequest,
} from "../api"

const videoQualityOptions: Array<{ value: NoxtubizerVideoQuality; label: string }> = [
  { value: "best", label: "Best available" },
  { value: "4320p", label: "4320p (8K)" },
  { value: "2160p", label: "2160p (4K)" },
  { value: "1440p", label: "1440p (2K)" },
  { value: "1080p", label: "1080p" },
  { value: "720p", label: "720p" },
  { value: "480p", label: "480p" },
  { value: "360p", label: "360p" },
  { value: "240p", label: "240p" },
]

const videoFormatOptions: Array<{ value: NoxtubizerVideoFormat; label: string }> = [
  { value: "mp4", label: "MP4" },
  { value: "mkv", label: "MKV" },
]

interface Props {
  videoFormat: NoxtubizerVideoFormat
  videoQuality: NoxtubizerVideoQuality
  onChange: (payload: Partial<NoxtubizerCreateRequest>) => void
}

export default function VideoSelector({ videoFormat, videoQuality, onChange }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Video quality</label>
        <select
          value={videoQuality}
          onChange={(e) =>
            onChange({ video_quality: e.target.value as NoxtubizerVideoQuality })
          }
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-violet-500"
        >
          {videoQualityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Video format</label>
        <select
          value={videoFormat}
          onChange={(e) =>
            onChange({ video_format: e.target.value as NoxtubizerVideoFormat })
          }
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-violet-500"
        >
          {videoFormatOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
