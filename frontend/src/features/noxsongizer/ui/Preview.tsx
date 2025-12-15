import { AudioPreview } from "@/shared/ui"
import { getSourceUrl, type NoxsongizerJob } from "../api"

type Props = { job: NoxsongizerJob }

export default function Preview({ job }: Props) {
  return (
    <AudioPreview
      id={job.id}
      sourceUrl={getSourceUrl(job.id)}
    />
  )
}
