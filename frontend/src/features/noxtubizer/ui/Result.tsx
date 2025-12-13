import { JobStatusGate } from "@/features/job-status"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import { type Job } from "@/entities/job"
import {
  getNoxtubizerDownloadUrl,
  type NoxtubizerJobResult,
} from "../api"
import AssetBlock from "@/shared/ui/AssetBlock"
import AudioPlayer from "@/shared/ui/AudioPlayer"
import VideoPlayer from "@/shared/ui/VideoPlayer"

type Props = {
  job: Job<unknown, NoxtubizerJobResult>
}

export default function Result({ job }: Props) {
  return (
    <JobStatusGate
      job={job}
      onDone={() => {
        const result = job.result

        if (!result) {
          return (
            <NoticeMessage
              title="No outputs"
              message="The job completed but produced no downloadable files."
              tone="warning"
            />
          )
        }

        return (
          <div className="space-y-3">
            {result.mode === "both" && result.both?.filename && (
              (() => {
                const filename = result.both.filename
                const url = getNoxtubizerDownloadUrl(job.id, filename)

                return (
                  <AssetBlock title={filename} downloadUrl={url}>
                    <VideoPlayer url={url} filename={filename} hasAudio={true} height={400} />
                  </AssetBlock>
                )
              })()
            )}

            {result.mode === "video" && result.video?.filename && (
              (() => {
                const filename = result.video.filename
                const url = getNoxtubizerDownloadUrl(job.id, filename)

                return (
                  <AssetBlock title={filename} downloadUrl={url}>
                    <VideoPlayer url={url} filename={filename} hasAudio={false} height={400} />
                  </AssetBlock>
                )
              })()
            )}

            {result.mode === "audio" && result.audio?.filename && (
              (() => {
                const filename = result.audio.filename
                const url = getNoxtubizerDownloadUrl(job.id, filename)

                return (
                  <AssetBlock title={filename} downloadUrl={url}>
                    <AudioPlayer url={url} />
                  </AssetBlock>
                )
              })()
            )}
          </div>
        )
      }}
    />
  )
}
