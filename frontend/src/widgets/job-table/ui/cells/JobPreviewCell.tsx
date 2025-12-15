import type { Job } from "@/entities/job"

import { Preview as NoxelizerPreview } from "@/features/noxelizer"
import { Preview as NoxsongizerPreview } from "@/features/noxsongizer"
import { Preview as NoxtubizerPreview } from "@/features/noxtubizer"
import { Preview as NoxtunizerPreview } from "@/features/noxtunizer"

export default function JobPreviewCell({ job }: { job: Job }) {
  switch (job.tool) {
    case "noxsongizer":
      return <NoxsongizerPreview job={job} />

    case "noxtunizer":
      return <NoxtunizerPreview job={job} />

    case "noxelizer":
      return <NoxelizerPreview job={job} />

    case "noxtubizer":
      return <NoxtubizerPreview job={job} />

    default:
      return null
  }
}
