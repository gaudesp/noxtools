import { AudioPreview } from "@/shared/ui"
import { getNoxtunizerSourceUrl, type NoxtunizerJob } from "../api"

type Props = { job: NoxtunizerJob }

export default function Preview({ job }: Props) {
  return (
    <AudioPreview
      id={job.id}
      sourceUrl={getNoxtunizerSourceUrl(job.id)}
    />
  )
}
