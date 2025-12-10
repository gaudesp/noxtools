import { useEffect, useRef, useState } from "react"
import {
  createNoxtubizerJob,
  type NoxtubizerCreateRequest,
} from "../lib/api"
import { useJobStream } from "../lib/jobs"
import { useNotifications } from "../components/notifications/Notifications"
import JobTable from "../components/jobs/JobTable"
import NoxtubizerPreviewModal from "../components/noxtubizer/NoxtubizerPreviewModal"
import AudioSelector from "../components/noxtubizer/AudioSelector"
import VideoSelector from "../components/noxtubizer/VideoSelector"

const defaultFormState: NoxtubizerCreateRequest = {
  url: "",
  mode: "audio",
  audio_quality: "high",
  audio_format: "mp3",
  video_quality: "best",
  video_format: "mp4",
}

export default function Noxtubizer() {
  const [form, setForm] = useState<NoxtubizerCreateRequest>(defaultFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const { notify } = useNotifications()
  const lastErrorRef = useRef<string | null>(null)

  const pageSize = 10
  const offset = (page - 1) * pageSize

  const {
    jobs: allJobs,
    loading,
    error,
    deleteJob: deleteJobLive,
    getJobById,
  } = useJobStream({ tool: "noxtubizer" })

  const pagedJobs = allJobs.slice(offset, offset + pageSize)
  const total = allJobs.length
  const selectedJob = getJobById(selectedJobId)

  const requiresAudio = form.mode === "audio" || form.mode === "both"
  const requiresVideo = form.mode === "video" || form.mode === "both"

  async function submitJob() {
    if (!form.url.trim()) {
      notify("Please paste a valid YouTube URL.", "danger")
      return
    }

    try {
      setIsSubmitting(true)
      const payload: NoxtubizerCreateRequest = {
        ...form,
        url: form.url.trim(),
      }
      await createNoxtubizerJob(payload)
      notify(`1 job(s) created.`, "success")
      setForm((prev) => ({ ...prev, url: "" }))
    } catch (err) {
      console.error(err)
      notify("Failed to queue Noxtubizer job.", "danger")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      notify(error, "danger")
      lastErrorRef.current = error
    }
  }, [error, notify])

  function onCloseModal() {
    setSelectedJobId(null)
  }

  return (
    <div className="p-6 text-white space-y-8">
      <h1 className="text-2xl font-bold mb-2">Noxtubizer</h1>
      <p className="text-sm text-slate-400">
        Download audio, video, or both from YouTube with exact quality and format control.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">YouTube URL</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <p className="block text-sm font-semibold mb-2">Mode</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: "audio", label: "Audio", description: "Grab audio only" },
                { value: "video", label: "Video", description: "Grab video only (no audio track)" },
                { value: "both", label: "Both", description: "Merge best audio + video into one file" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={[
                    "border rounded-md px-3 py-3 cursor-pointer transition bg-slate-950/60",
                    form.mode === opt.value
                      ? "border-violet-500 shadow-[0_0_0_1px_rgba(139,92,246,0.4)]"
                      : "border-slate-700 hover:border-violet-400",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={opt.value}
                    checked={form.mode === opt.value}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        mode: e.target.value as NoxtubizerCreateRequest["mode"],
                      }))
                    }
                    className="mr-2 accent-violet-500"
                  />
                  <div className="inline-flex flex-col">
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-xs text-slate-400">{opt.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {requiresAudio && (
            <AudioSelector
              audioFormat={form.audio_format || "mp3"}
              audioQuality={form.audio_quality || "high"}
              onChange={(payload) => setForm((prev) => ({ ...prev, ...payload }))}
            />
          )}

          {requiresVideo && (
            <VideoSelector
              videoFormat={form.video_format || "mp4"}
              videoQuality={form.video_quality || "best"}
              onChange={(payload) => setForm((prev) => ({ ...prev, ...payload }))}
            />
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...defaultFormState })}
              disabled={isSubmitting}
              className="text-sm text-slate-300 hover:text-white underline-offset-4 underline disabled:opacity-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={submitJob}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {isSubmitting ? "Queuing…" : "Download"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-3">
        <JobTable
          jobs={pagedJobs}
          total={total}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={(p) => setPage(p)}
          onSelectJob={(job) => setSelectedJobId(job.id)}
          onDeleteJob={async (job) => {
            try {
              await deleteJobLive(job.id)
              notify("Job deleted.", "success")
            } catch (err) {
              console.error(err)
              notify("Failed to delete job.", "danger")
            }
          }}
          loading={loading}
          error={null}
        />
      </div>

      <NoxtubizerPreviewModal
        job={selectedJob}
        open={Boolean(selectedJob)}
        onClose={onCloseModal}
      />
    </div>
  )
}
