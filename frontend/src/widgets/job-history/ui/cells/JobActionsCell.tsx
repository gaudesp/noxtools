import { useState } from "react"
import type { Job } from "@/entities/job"
import { ConfirmModal } from "@/shared/ui"

export default function JobActionsCell({
  job,
  onDelete,
}: {
  job: Job
  onDelete?: (job: Job) => void
}) {
  const [open, setOpen] = useState(false)

  const isRunning = job.status === "running"

  return (
    <>
      <button
        type="button"
        aria-disabled={isRunning}
        onClick={(e) => {
          e.stopPropagation()
          if (isRunning) return
          setOpen(true)
        }}
        className={`text-xs px-2 py-1 rounded border transition ${
          isRunning
            ? "border-rose-700 text-rose-300 opacity-50 cursor-not-allowed"
            : "border-rose-700 text-rose-200 hover:bg-rose-900/30"
        }`}
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
