import { type ReactNode } from "react"
import { NoticeMessage } from "@/shared/ui"
import type { Job } from "@/entities/job"
import type { JobStatusMessages } from "../model/types"

type Props<R> = {
  job: Job<unknown, R>
  onDone: () => ReactNode
  messages?: Partial<JobStatusMessages>
}

const DEFAULT_MESSAGES: JobStatusMessages = {
  pending: "Job is queued and will start processing soon.",
  running: "Job is currently being executed.",
  error: {
    title: "Job failed",
    message: "An error occurred while executing the job.",
  },
}

export default function JobStatusGate<R>({
  job,
  onDone,
  messages = {},
}: Props<R>) {
  const merged = {
    ...DEFAULT_MESSAGES,
    ...messages,
    error: {
      ...DEFAULT_MESSAGES.error,
      ...messages.error,
    },
  }

  if (job.status === "pending") {
    return <NoticeMessage message={merged.pending} tone="warning" />
  }

  if (job.status === "running") {
    return (
      <NoticeMessage
        message={merged.running}
        withSpinner
        tone="info"
      />
    )
  }

  if (job.status === "error") {
    return (
      <NoticeMessage
        title={merged.error.title}
        message={merged.error.message}
        details={job.error_message}
        tone="danger"
      />
    )
  }

  if (job.status === "done") {
    return <>{onDone()}</>
  }

  return null
}
