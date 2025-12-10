import JobDetailsModal from "../jobs/JobDetailsModal"
import NoxtubizerResultPreview from "../jobs/NoxtubizerResultPreview"
import { type Job } from "../../lib/api"

type Props = {
  job: Job | null
  open: boolean
  onClose: () => void
}

export default function NoxtubizerPreviewModal({ job, open, onClose }: Props) {
  return (
    <JobDetailsModal
      job={job}
      open={open}
      onClose={onClose}
      renderContent={(currentJob) => <NoxtubizerResultPreview job={currentJob} />}
    />
  )
}
