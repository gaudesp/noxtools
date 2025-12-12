import { useState, useEffect } from "react"
import { useLayout } from "@/app/layout"

import NoxelizerForm from "@/widgets/noxelizer/NoxelizerForm"
import NoxelizerTaskHistory from "@/widgets/noxelizer/NoxelizerTaskHistory"
import NoxelizerPreviewModal from "@/widgets/noxelizer/NoxelizerPreviewModal"
import { useNoxelizerJobs } from "@/features/noxelizer/model"

export default function NoxelizerPage() {
  const { setHeader, setFooter } = useLayout()
  const jobsStore = useNoxelizerJobs()
  const { jobs, loading, selectedItem, clear } = jobsStore

  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    setHeader({
      title: "Noxelizer",
      description: "Transform images into smooth depixelization reveal videos.",
      eyebrow: "Image to video",
    })

    setFooter(jobs, loading)
    return () => setFooter([], false)
  }, [jobs, loading, setHeader, setFooter])

  return (
    <div className="flex flex-col gap-8">
      <NoxelizerForm />

      <NoxelizerTaskHistory
        store={jobsStore}
        onSelectJob={() => setPreviewOpen(true)}
      />

      <NoxelizerPreviewModal
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
