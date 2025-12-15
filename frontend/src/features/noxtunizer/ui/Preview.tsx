import { AudioPreview } from "@/shared/ui"
import { getSourceUrl, type NoxtunizerJob } from "../api"

type Props = { job: NoxtunizerJob }

export default function Preview({ job }: Props) {
  return (
    <AudioPreview
      id={job.id}
      sourceUrl={getSourceUrl(job.id)}
    />
  )
}
