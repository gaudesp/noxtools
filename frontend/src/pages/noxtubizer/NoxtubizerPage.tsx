import { useState, useEffect } from "react"
import { useLayout } from "@/app/layout"

import NoxtubizerForm from "@/widgets/noxtubizer/NoxtubizerForm"
import NoxtubizerTaskHistory from "@/widgets/noxtubizer/NoxtubizerTaskHistory"
import NoxtubizerPreviewModal from "@/widgets/noxtubizer/NoxtubizerPreviewModal"
import { useNoxtubizerJobs } from "@/features/noxtubizer/model"

export default function NoxtubizerPage() {
  const { setHeader, setFooter } = useLayout()
  const jobsStore = useNoxtubizerJobs()
  const { jobs, loading, selectedItem, clear } = jobsStore

  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    setHeader({
      title: "Noxtubizer",
      description: "Download audio, video, or both from YouTube with precise control.",
      eyebrow: "YouTube downloader",
    })

    setFooter(jobs, loading)
    return () => setFooter([], false)
  }, [jobs, loading, setHeader, setFooter])

  return (
    <div className="flex flex-col gap-8">
      <NoxtubizerForm />

      <NoxtubizerTaskHistory
        store={jobsStore}
        onSelectJob={() => setPreviewOpen(true)}
      />

      <NoxtubizerPreviewModal
        job={selectedItem}
        open={previewOpen && !!selectedItem}
        onClose={() => {
          clear()
          setPreviewOpen(false)
        }}
      />
    </div>
  )
}
