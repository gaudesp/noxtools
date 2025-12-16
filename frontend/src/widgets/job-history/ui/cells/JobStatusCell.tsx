import { type Job, StatusBadge } from "@/entities/job"

export default function JobStatusCell({ job }: { job: Job }) {
  return <StatusBadge status={job.status} />
}
