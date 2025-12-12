import { type ReactNode } from "react"
import Modal from "@/shared/ui/Modal"
import { type Job } from "@/entities/job"
import JobPreviewHeader from "./JobPreviewHeader"
import JobPreviewDates from "./JobPreviewDates"

type Props = {
  job: Job | null
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export default function JobPreviewLayout({
  job,
  open,
  onClose,
  children,
  footer,
}: Props) {
  if (!job) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      header={<JobPreviewHeader job={job} onClose={onClose} />}
      footer={footer}
    >
      <JobPreviewDates job={job} />
      <div className="mt-6">{children}</div>
    </Modal>
  )
}
