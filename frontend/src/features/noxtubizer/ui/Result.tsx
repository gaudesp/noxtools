import { cleanFileName } from "@/entities/file"
import { JobStatusGate } from "@/entities/job"
import { NoticeMessage, FileBlock, AudioPlayer, VideoPlayer } from "@/shared/ui"
import { getDownloadUrl, type NoxtubizerJob } from "../api"

type Props = { job: NoxtubizerJob }

export default function Result({ job }: Props) {
  return (
    <JobStatusGate
      job={job}
      onDone={() => {
        const outputLinks = job.result?.files?.filter((item) => item.role === "output") ?? []
        const outputs = outputLinks.map((item) => item.file)
        const summary = job.result?.summary
        const mode = summary?.mode ?? job.params?.mode ?? null

        const audioOutputs = outputs.filter((file) => file.type === "audio")
        const videoOutputs = outputs.filter((file) => file.type === "video")
        const extraOutputs = outputs.filter(
          (file) => file.type !== "audio" && file.type !== "video",
        )

        const orderedOutputs = [
          ...(mode === "audio"
            ? audioOutputs
            : mode === "video"
              ? videoOutputs
              : [...videoOutputs, ...audioOutputs]),
          ...extraOutputs,
        ].filter(Boolean)
        const resolvedOutputs = orderedOutputs.length ? orderedOutputs : outputs

        if (!resolvedOutputs.length) {
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
            {resolvedOutputs.map((file) => {
              const link = outputLinks.find((item) => item.file.id === file.id)
              const fallbackLabel =
                file.type === "video"
                  ? "Video"
                  : file.type === "audio"
                    ? "Audio"
                    : cleanFileName(file.name) || file.name
              const label = link?.label || fallbackLabel
              const url = getDownloadUrl(job.id, file.name)
              const subtitle = cleanFileName(file.name) || file.name

              if (file.type === "video") {
                return (
                  <FileBlock key={file.id} title={label} subtitle={subtitle} href={url}>
                    <VideoPlayer url={url} height={400} />
                  </FileBlock>
                )
              }

              if (file.type === "audio") {
                return (
                  <FileBlock key={file.id} title={label} subtitle={subtitle} href={url}>
                    <AudioPlayer url={url} />
                  </FileBlock>
                )
              }

              return (
                <FileBlock key={file.id} title={label} subtitle={subtitle} href={url}>
                  <div className="text-xs text-slate-400">
                    Preview unavailable for this file type.
                  </div>
                </FileBlock>
              )
            })}
          </div>
        )
      }}
    />
  )
}
