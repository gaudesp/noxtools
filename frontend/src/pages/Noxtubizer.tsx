import { useCallback, useMemo, useState } from "react"
import ErrorMessage from "../components/common/ErrorMessage"
import NoxtubizerResultPreview from "../components/jobs/NoxtubizerResultPreview"
import { useNotifications } from "../components/notifications/Notifications"
import AudioSelector from "../components/noxtubizer/AudioSelector"
import VideoSelector from "../components/noxtubizer/VideoSelector"
import JobPreviewModal from "../components/tooling/JobPreviewModal"
import JobHistorySection from "../components/tooling/JobHistorySection"
import SectionCard from "../components/tooling/SectionCard"
import ToolPageLayout from "../components/tooling/ToolPageLayout"
import ToolSummaryRow from "../components/tooling/ToolSummaryRow"
import { createNoxtubizerJob, type NoxtubizerCreateRequest, type Job } from "../lib/api"
import { useToolJobs } from "../hooks/useToolJobs"

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
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { notify } = useNotifications()

  const {
    jobs,
    pagedJobs,
    total,
    page,
    pageSize,
    setPage,
    loading,
    error: streamError,
    deleteJob,
    selectedJob,
    selectJob,
    clearSelection,
  } = useToolJobs({ tool: "noxtubizer" })

  const requiresAudio = useMemo(
    () => form.mode === "audio" || form.mode === "both",
    [form.mode],
  )
  const requiresVideo = useMemo(
    () => form.mode === "video" || form.mode === "both",
    [form.mode],
  )

  async function submitJob() {
    try {
      setIsSubmitting(true)
      setFormError(null)
      setActionError(null)

      if (!form.url.trim()) {
        setFormError("Please paste a valid YouTube URL.")
        return
      }

      const payload: NoxtubizerCreateRequest = {
        ...form,
        url: form.url.trim(),
      }
      await createNoxtubizerJob(payload)
      notify(`1 job(s) created.`, "success")
      setForm((prev) => ({ ...prev, url: "" }))
    } catch (err) {
      console.error(err)
      setFormError("Failed to queue Noxtubizer job.")
      notify("Failed to queue Noxtubizer job.", "danger")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderJobContent = useCallback(
    (job: Job) => <NoxtubizerResultPreview job={job} />,
    [],
  )

  return (
    <ToolPageLayout
      title="Noxtubizer"
      description="Download audio, video, or both from YouTube with exact quality and format control."
      eyebrow="YouTube downloader"
    >
      <SectionCard
        title="Configure your download"
        description="Paste a YouTube URL, choose what you need, and we will queue the job."
      >
        <div className="space-y-5">
          {formError ? (
            <ErrorMessage title="Invalid request" message={formError} compact />
          ) : null}

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
      </SectionCard>

      {actionError ? (
        <ErrorMessage title="Action failed" message={actionError} compact />
      ) : null}

      <JobHistorySection
        jobs={pagedJobs}
        total={total}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={(p) => setPage(p)}
        onSelectJob={(job) => {
          selectJob(job.id)
          setPreviewOpen(true)
        }}
        onDeleteJob={async (job) => {
          try {
            setActionError(null)
            await deleteJob(job.id)
            if (selectedJob?.id === job.id) {
              clearSelection()
              setPreviewOpen(false)
            }
            notify("Job deleted.", "success")
          } catch (err) {
            console.error(err)
            setActionError("Failed to delete job.")
            notify("Failed to delete job.", "danger")
          }
        }}
        loading={loading}
        error={streamError}
      />

      <JobPreviewModal
        job={selectedJob}
        open={Boolean(previewOpen && selectedJob)}
        onClose={() => {
          clearSelection()
          setPreviewOpen(false)
        }}
        renderPreview={renderJobContent}
      />

      <ToolSummaryRow jobs={jobs} loading={loading} />
    </ToolPageLayout>
  )
}
