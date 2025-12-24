import { NoticeMessage, AudioPlayer, FileBlock } from "@/shared/ui"
import { JobStatusGate } from "@/entities/job"
import { getDownloadUrl, type NoxsongizerJob } from "../api"

type StemType = "vocals" | "other" | "drums" | "bass"

const STEM_ORDER: Array<{ type: StemType; label: string }> = [
  { type: "vocals", label: "Vocals" },
  { type: "other", label: "Other" },
  { type: "bass", label: "Bass" },
  { type: "drums", label: "Drums" },
]

function isStemMatch(stem: string, type: StemType): boolean {
  const lowerStem = stem.toLowerCase()
  return (
    lowerStem === `${type}.wav` ||
    lowerStem.endsWith(`_${type}.wav`) ||
    lowerStem.startsWith(`[${type}] `)
  )
}

type Props = { job: NoxsongizerJob }

export default function Result({ job }: Props) {
  return (
    <JobStatusGate
      job={job}
      onDone={() => {
        const outputs = job.result?.files?.filter((item) => item.role === "output") ?? []

        const orderedStems = STEM_ORDER.map((stemInfo) => {
          const match = outputs.find((item) => {
            const label = item.label?.toLowerCase()
            return (
              label === stemInfo.label.toLowerCase() ||
              isStemMatch(item.file.name, stemInfo.type)
            )
          })
          return match ? { ...stemInfo, filename: match.file.name } : null
        }).filter(Boolean) as Array<{
          type: StemType
          label: string
          filename: string
        }>

        if (!orderedStems.length) {
          return (
            <NoticeMessage
              title="No stems available"
              message="The job completed but no stem files were recorded."
              tone="warning"
            />
          )
        }

        return (
          <div className="grid gap-4 md:grid-cols-2">
            {orderedStems.map(({ label, filename }) => {
              const url = getDownloadUrl(job.id, filename)

              return (
                <FileBlock title={label} href={url}>
                  <AudioPlayer url={url} />
                </FileBlock>
              )
            })}
          </div>
        )
      }}
    />
  )
}
