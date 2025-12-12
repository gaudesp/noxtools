import PreviewModal from "@/shared/ui/PreviewModal"
import { ResultPreview } from "@/features/noxsongizer/ui"
import { type Job } from "@/features/noxsongizer/api"

interface Props {
  job: Job | null
  open: boolean
  onClose: () => void
}

export default function NoxsongizerPreviewModal({ job, open, onClose }: Props) {
  return (
    <PreviewModal
      task={job}
      open={open}
      onClose={onClose}
      renderPreview={(task) => <ResultPreview job={task} />}
    />
  )
}
