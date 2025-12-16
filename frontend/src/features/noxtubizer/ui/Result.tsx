import { JobStatusGate } from "@/entities/job"
import { NoticeMessage, FileBlock, AudioPlayer, VideoPlayer } from "@/shared/ui"
import { getDownloadUrl, type NoxtubizerJob } from "../api"

type Props = { job: NoxtubizerJob }

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
          <div className="space-y-4">
            {result.mode === "both" && result.both?.filename && (
              (() => {
                const filename = result.both.filename
                const url = getDownloadUrl(job.id, filename)

                return (
                  <FileBlock title="Audio + Video" href={url}>
                    <VideoPlayer url={url} hasAudio={true} height={400} />
                  </FileBlock>
                )
              })()
            )}

            {result.mode === "video" && result.video?.filename && (
              (() => {
                const filename = result.video.filename
                const url = getDownloadUrl(job.id, filename)

                return (
                  <FileBlock title="Video" href={url}>
                    <VideoPlayer url={url} hasAudio={false} height={400} />
                  </FileBlock>
                )
              })()
            )}

            {result.mode === "audio" && result.audio?.filename && (
              (() => {
                const filename = result.audio.filename
                const url = getDownloadUrl(job.id, filename)

                return (
                  <FileBlock title="Audio" href={url}>
                    <AudioPlayer url={url} />
                  </FileBlock>
                )
              })()
            )}
          </div>
        )
      }}
    />
  )
}
