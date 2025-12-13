import { JobStatusGate } from "@/features/job-status"
import NoticeMessage from "@/shared/ui/NoticeMessage"
import AssetBlock from "@/shared/ui/AssetBlock"
import AudioPlayer from "@/shared/ui/AudioPlayer"
import { type Job } from "@/entities/job"
import {
  getNoxsongizerDownloadUrl,
  type NoxsongizerJobResult,
} from "../api"

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

type Props = {
  job: Job<unknown, NoxsongizerJobResult>
}

export default function Result({ job }: Props) {
  return (
    <JobStatusGate
      job={job}
      onDone={() => {
        const stems = job.output_files || job.result?.stems || []

        const orderedStems = STEM_ORDER.map((stemInfo) => {
          const match = stems.find((stem) => isStemMatch(stem, stemInfo.type))
          return match ? { ...stemInfo, filename: match } : null
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
          <div className="grid gap-3 md:grid-cols-2">
            {orderedStems.map(({ label, filename, type }) => {
              const url = getNoxsongizerDownloadUrl(job.id, filename)
              return (
                <AssetBlock key={type} title={label} downloadUrl={url}>
                  <AudioPlayer url={url} />
                </AssetBlock>
              )
            })}
          </div>
        )
      }}
    />
  )
}
