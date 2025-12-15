import { useState } from "react"
import type { Job } from "@/entities/job"
import { ConfirmModal } from "@/shared/ui/modal"

export default function JobActionsCell({
  job,
  onDelete,
}: {
  job: Job
  onDelete?: (job: Job) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        disabled={job.status === "running"}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="text-xs px-2 py-1 rounded border border-rose-700 text-rose-200"
      >
        Delete
      </button>

      <ConfirmModal
        open={open}
        title="Delete job?"
        message="This will remove the job and its related files."
        confirmLabel="Delete"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          onDelete?.(job)
          setOpen(false)
        }}
      />
    </>
  )
}
