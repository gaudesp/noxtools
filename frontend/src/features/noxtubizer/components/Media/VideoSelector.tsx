import { type NoxtubizerCreateRequest } from "@/features/noxtubizer/api/api"

const videoQualityOptions: Array<{ value: NoxtubizerCreateRequest["video_quality"]; label: string }> = [
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

const videoFormatOptions: Array<{ value: NonNullable<NoxtubizerCreateRequest["video_format"]>; label: string }> = [
  { value: "mp4", label: "MP4" },
  { value: "mkv", label: "MKV" },
]

type Props = {
  videoFormat: NonNullable<NoxtubizerCreateRequest["video_format"]>
  videoQuality: NoxtubizerCreateRequest["video_quality"]
  onChange: (
    payload: Partial<Pick<NoxtubizerCreateRequest, "video_format" | "video_quality">>,
  ) => void
}

export default function VideoSelector({ videoFormat, videoQuality, onChange }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Video quality</label>
        <select
          value={videoQuality}
          onChange={(e) => onChange({ video_quality: e.target.value as NoxtubizerCreateRequest["video_quality"] })}
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
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
          onChange={(e) => onChange({ video_format: e.target.value as NoxtubizerCreateRequest["video_format"] })}
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
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
