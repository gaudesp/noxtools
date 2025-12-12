import { useEffect, useState } from "react"
import { useLayout } from "@/app/layout"
import NoxtunizerForm from "@/widgets/noxtunizer/NoxtunizerForm"
import NoxtunizerTaskHistory from "@/widgets/noxtunizer/NoxtunizerTaskHistory"
import NoxtunizerPreviewModal from "@/widgets/noxtunizer/NoxtunizerPreviewModal"
import { useNoxtunizerJobs } from "@/features/noxtunizer/model"

export default function NoxtunizerPage() {
  const { setHeader, setFooter } = useLayout()
  const jobsStore = useNoxtunizerJobs()
  const { jobs, loading, selectedItem, clear } = jobsStore

  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    setHeader({
      title: "Noxtunizer",
      description: "Extract BPM, key and duration from any track.",
      eyebrow: "Musical analysis",
    })

    setFooter(jobs, loading)

    return () => {
      setFooter([], false)
    }
  }, [jobs, loading])

  return (
    <div className="flex flex-col gap-8">
      <NoxtunizerForm />

      <NoxtunizerTaskHistory
        store={jobsStore}
        onSelectJob={() => setPreviewOpen(true)}
      />

      <NoxtunizerPreviewModal
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
