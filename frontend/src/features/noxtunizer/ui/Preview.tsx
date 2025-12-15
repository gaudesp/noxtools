import type { Job } from "@/entities/job"
import { AudioPreview } from "@/shared/ui"
import { getNoxtunizerSourceUrl } from "../api"
import { isJob } from "../model"

type Props = { job: Job }

export default function Preview({ job }: Props) {
  if (!isJob(job)) return null

  return (
    <AudioPreview
      id={job.id}
      sourceUrl={getNoxtunizerSourceUrl(job.id)}
    />
  )
}
