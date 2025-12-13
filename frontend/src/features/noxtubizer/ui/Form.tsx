import Section from "@/shared/ui/Section"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import SubmitButton from "@/shared/ui/SubmitButton"
import ResetButton from "@/shared/ui/ResetButton"
import { useCreateNoxtubizerJob } from "../model"
import {
  UrlField,
  ModeField,
  AudioField,
  VideoField,
} from "./form"

export default function Form() {
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
          <NoticeMessage
            title="Invalid request"
            message={formError}
            tone="danger"
            compact
          />
        )}

        <UrlField
          value={form.url}
          onChange={(url) => updateForm({ url })}
        />

        <ModeField
          value={form.mode}
          onChange={(mode) => updateForm({ mode })}
        />

        {requiresAudio && (
          <AudioField
            audioFormat={form.audio_format || "mp3"}
            audioQuality={form.audio_quality || "high"}
            onChange={(payload) => updateForm(payload)}
          />
        )}

        {requiresVideo && (
          <VideoField
            videoFormat={form.video_format || "mp4"}
            videoQuality={form.video_quality || "best"}
            onChange={(payload) => updateForm(payload)}
          />
        )}

        <div className="flex items-center justify-end gap-3">
          <ResetButton disabled={isSubmitting} onClick={resetForm} />
          <SubmitButton
            loading={isSubmitting}
            onClick={submit}
            label="Download"
          />
        </div>
      </div>
    </Section>
  )
}
