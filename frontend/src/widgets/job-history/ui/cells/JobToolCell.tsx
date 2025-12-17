import { type Job } from "@/entities/job"
import JobMetaTags from "@/entities/job/ui/JobMetaTags"

type Props = {
  job: Job
  toolColor: (tool: Job["tool"]) => string | undefined
}

export default function JobToolCell({ job, toolColor }: Props) {
  return (
    <JobMetaTags
      job={job}
      toolColor={toolColor}
      mode="tool-only"
    />
  )
}
