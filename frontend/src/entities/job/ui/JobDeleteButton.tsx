import { useState } from "react"
import type { Job } from "../model/types"
import { ConfirmModal, useNotifications } from "@/shared/ui"

type Props = {
  job: Job
  onDelete?: (job: Job) => void | Promise<void>
}

export default function JobDeleteButton({ job, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { notify } = useNotifications()

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
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          if (deleting) return
          if (!onDelete) {
            setOpen(false)
            return
          }
          setDeleting(true)
          try {
            await onDelete(job)
            notify("Job deleted.", "success")
          } catch (err) {
            console.error(err)
            notify("Failed to delete job.", "danger")
          } finally {
            setDeleting(false)
          }
          setOpen(false)
        }}
      />
    </>
  )
}
