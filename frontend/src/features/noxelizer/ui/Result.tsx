import { JobStatusGate } from "@/entities/job"
import { FileBlock, NoticeMessage, VideoPlayer } from "@/shared/ui"
import { getDownloadUrl, type NoxelizerJob } from "../api"

type Props = { job: NoxelizerJob }

export default function Result({ job }: Props) {
  return (
    <JobStatusGate
      job={job}
      onDone={() => {
        const filename =
          job.result?.video ||
          job.output_files?.[0] ||
          null

        if (!filename) {
          return (
            <NoticeMessage
              title="No video available"
              message="The job completed but no output video was recorded."
              tone="warning"
            />
          )
        }

        const url = getDownloadUrl(job.id, filename)

        return (
          <FileBlock title="Video" href={url}>
            <VideoPlayer url={url} height={400} />
          </FileBlock>
        )
      }}
    />
  )
}
