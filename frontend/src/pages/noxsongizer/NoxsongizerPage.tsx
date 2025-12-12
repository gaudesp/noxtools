import { useState, useEffect } from "react"
import { useLayout } from "@/app/layout"
import NoxsongizerForm from "@/widgets/noxsongizer/NoxsongizerForm"
import NoxsongizerTaskHistory from "@/widgets/noxsongizer/NoxsongizerTaskHistory"
import NoxsongizerPreviewModal from "@/widgets/noxsongizer/NoxsongizerPreviewModal"
import { useNoxsongizerJobs } from "@/features/noxsongizer/model"

export default function NoxsongizerPage() {
  const { setHeader, setFooter } = useLayout()
  const jobsStore = useNoxsongizerJobs()
  const { jobs, loading, selectedItem, clear } = jobsStore
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    setHeader({
      title: "Noxsongizer",
      description:
        "Split a song into separate audio stems (vocals, bass, drums and other).",
      eyebrow: "Audio separation",
    })

    setFooter(jobs, loading)
    return () => setFooter([], false)
  }, [jobs, loading])

  return (
    <div className="flex flex-col gap-8">
      <NoxsongizerForm />

      <NoxsongizerTaskHistory
        store={jobsStore}
        onSelectJob={() => setPreviewOpen(true)}
      />

      <NoxsongizerPreviewModal
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
