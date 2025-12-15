import { AudioPreview } from "@/shared/ui"
import { getNoxsongizerSourceUrl, type NoxsongizerJob } from "../api"
import { isJob } from "../model"

type Props = { job: NoxsongizerJob }

export default function Preview({ job }: Props) {
  if (!isJob(job)) return null

  return (
    <AudioPreview
      id={job.id}
      sourceUrl={getNoxsongizerSourceUrl(job.id)}
    />
  )
}
