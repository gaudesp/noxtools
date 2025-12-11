import PreviewModal from "@/shared/ui/PreviewModal"
import { ResultPreview } from "@/features/noxtubizer/ui"
import { type Job } from "@/features/noxtubizer/api"

interface Props {
  job: Job | null
  open: boolean
  onClose: () => void
}

export default function NoxtubizerPreviewModal({ job, open, onClose }: Props) {
  return (
    <PreviewModal
      task={job}
      open={open}
      onClose={onClose}
      renderPreview={(task) => <ResultPreview job={task} />}
    />
  )
}
