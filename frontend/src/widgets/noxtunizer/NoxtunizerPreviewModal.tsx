import PreviewModal from "@/shared/ui/PreviewModal"
import { ResultPreview } from "@/features/noxtunizer/ui"
import { type Job } from "@/features/noxtunizer/api"

interface Props {
  job: Job | null
  open: boolean
  onClose: () => void
}

export default function NoxtunizerPreviewModal({ job, open, onClose }: Props) {
  return (
    <PreviewModal
      task={job}
      open={open}
      onClose={onClose}
      renderPreview={(task) => <ResultPreview job={task} />}
    />
  )
}
