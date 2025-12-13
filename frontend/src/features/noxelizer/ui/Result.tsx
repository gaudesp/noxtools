import { JobStatusGate } from "@/features/job-status"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import VideoPlayer from "@/shared/ui/VideoPlayer"
import AssetBlock from "@/shared/ui/AssetBlock"
import { type Job } from "@/entities/job"
import {
  getNoxelizerDownloadUrl,
  type NoxelizerJobResult,
} from "../api"

type Props = {
  job: Job<unknown, NoxelizerJobResult>
}

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

        const url = getNoxelizerDownloadUrl(job.id, filename)

        return (
          <AssetBlock title="Video" downloadUrl={url}>
            <VideoPlayer url={url} filename={filename} height={400} />
          </AssetBlock>
        )
      }}
    />
  )
}
