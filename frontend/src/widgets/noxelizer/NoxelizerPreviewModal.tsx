import PreviewModal from "@/shared/ui/PreviewModal"
import { ResultPreview } from "@/features/noxelizer/ui"
import { type Job } from "@/features/noxelizer/api"

interface Props {
  job: Job | null
  open: boolean
  onClose: () => void
}

export default function NoxelizerPreviewModal({ job, open, onClose }: Props) {
  return (
    <PreviewModal
      task={job}
      open={open}
      onClose={onClose}
      renderPreview={(task) => <ResultPreview job={task} />}
    />
  )
}
