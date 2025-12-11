import { Section } from "@/app/layout"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import {
  UrlInput,
  ModeSelector,
  AudioSelector,
  VideoSelector,
  SubmitButton,
  ResetButton,
} from "@/features/noxtubizer/ui"
import { useCreateNoxtubizerJob } from "@/features/noxtubizer/model"

export default function NoxtubizerForm() {
  const {
    form,
    updateForm,
    submit,
    formError,
    isSubmitting,
    resetForm,
  } = useCreateNoxtubizerJob()

  const requiresAudio = form.mode === "audio" || form.mode === "both"
  const requiresVideo = form.mode === "video" || form.mode === "both"

  return (
    <Section
      title="Configure your download"
      description="YouTube videos are fetched and converted according to the selected options."
    >
      <div className="space-y-5">
        {formError && (
          <NoticeMessage title="Invalid request" message={formError} tone="danger" compact />
        )}

        <UrlInput url={form.url} onChange={(url) => updateForm({ url })} />

        <div>
          <p className="block text-sm font-semibold mb-2">Mode</p>
          <ModeSelector mode={form.mode} onChange={(mode) => updateForm({ mode })} />
        </div>

        {requiresAudio && (
          <AudioSelector
            audioFormat={form.audio_format || "mp3"}
            audioQuality={form.audio_quality || "high"}
            onChange={(payload) => updateForm(payload)}
          />
        )}

        {requiresVideo && (
          <VideoSelector
            videoFormat={form.video_format || "mp4"}
            videoQuality={form.video_quality || "best"}
            onChange={(payload) => updateForm(payload)}
          />
        )}

        <div className="flex items-center justify-end gap-3">
          <ResetButton disabled={isSubmitting} onClick={resetForm} />
          <SubmitButton loading={isSubmitting} onClick={submit} />
        </div>
      </div>
    </Section>
  )
}
