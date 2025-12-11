export default function UrlInput({
  url,
  onChange,
}: {
  url: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">YouTube URL</label>
      <input
        type="url"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
        className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-violet-500"
      />
    </div>
  )
}
