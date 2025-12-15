import type { Job } from "@/entities/job"

import { Preview as NoxelizerPreview, type NoxelizerJob } from "@/features/noxelizer"
import { Preview as NoxsongizerPreview, type NoxsongizerJob } from "@/features/noxsongizer"
import { Preview as NoxtubizerPreview, type NoxtubizerJob } from "@/features/noxtubizer"
import { Preview as NoxtunizerPreview, type NoxtunizerJob } from "@/features/noxtunizer"

export default function JobPreviewCell({ job }: { job: Job }) {
  switch (job.tool) {
    case "noxsongizer":
      return <NoxsongizerPreview job={job as NoxsongizerJob} />

    case "noxtunizer":
      return <NoxtunizerPreview job={job as NoxtunizerJob} />

    case "noxelizer":
      return <NoxelizerPreview job={job as NoxelizerJob} />

    case "noxtubizer":
      return <NoxtubizerPreview job={job as NoxtubizerJob} />

    default:
      return null
  }
}
