import { useState } from "react"
import type { Job } from "../model/types"
import { ConfirmModal, useNotifications } from "@/shared/ui"

type Props = {
  job: Job
  onCancel?: (job: Job) => void | Promise<void>
}

export default function JobCancelButton({ job, onCancel }: Props) {
  const [open, setOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const { notify } = useNotifications()

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="text-xs px-2 py-1 rounded border border-amber-500/70 text-amber-100 transition hover:bg-amber-900/30"
      >
        Cancel
      </button>

      <ConfirmModal
        open={open}
        title="Cancel job?"
        message="This will stop the job and discard its current outputs."
        confirmLabel={cancelling ? "Cancelling..." : "Cancel job"}
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          if (cancelling) return
          if (!onCancel) {
            setOpen(false)
            return
          }
          setCancelling(true)
          try {
            await onCancel(job)
            notify("Job cancelled.", "warning")
          } catch (err) {
            console.error(err)
            notify("Failed to cancel job.", "danger")
          } finally {
            setCancelling(false)
          }
          setOpen(false)
        }}
      />
    </>
  )
}
