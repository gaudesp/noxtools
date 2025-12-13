import { useState } from "react"
import Section from "@/shared/ui/Section"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import SubmitButton from "@/shared/ui/SubmitButton"
import ResetButton from "@/shared/ui/ResetButton"
import { useFormSubmit } from "@/shared/lib/useFormSubmit"
import { useCreateNoxtubizerJob } from "../model"
import { UrlField, ModeField, AudioField, VideoField } from "./form"

export default function Form() {
  const { form, updateForm, submit, resetForm, isSubmitting } =
    useCreateNoxtubizerJob()
  const { handleResult } = useFormSubmit()

  const [formError, setFormError] = useState<string | null>(null)

  const requiresAudio = form.mode === "audio" || form.mode === "both"
  const requiresVideo = form.mode === "video" || form.mode === "both"

  async function handleSubmit() {
    const result = await submit()
    handleResult(result, setFormError)
  }

  function handleReset() {
    resetForm()
    setFormError(null)
  }

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
          <ResetButton disabled={isSubmitting} onClick={handleReset} />
          <SubmitButton
            loading={isSubmitting}
            onClick={handleSubmit}
            label="Download"
          />
        </div>
      </div>
    </Section>
  )
}
