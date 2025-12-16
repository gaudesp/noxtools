import {
  type VideoFormat,
  type VideoQuality,
  type CreateRequest,
} from "../../api"

const videoQualityOptions: Array<{ value: VideoQuality; label: string }> = [
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

const videoFormatOptions: Array<{ value: VideoFormat; label: string }> = [
  { value: "mp4", label: "MP4" },
  { value: "mkv", label: "MKV" },
]

type Props = {
  videoFormat: VideoFormat
  videoQuality: VideoQuality
  onChange: (payload: Partial<CreateRequest>) => void
}

export default function VideoField({
  videoFormat,
  videoQuality,
  onChange,
}: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="video-quality"
          className="block text-sm font-semibold mb-2"
        >
          Video quality
        </label>
        <select
          id="video-quality"
          name="video_quality"
          value={videoQuality}
          onChange={(e) =>
            onChange({ video_quality: e.target.value as VideoQuality })
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
        <label
          htmlFor="video-format"
          className="block text-sm font-semibold mb-2"
        >
          Video format
        </label>
        <select
          id="video-format"
          name="video_format"
          value={videoFormat}
          onChange={(e) =>
            onChange({ video_format: e.target.value as VideoFormat })
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
