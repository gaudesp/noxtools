import type { Job } from "@/entities/job"
import { Table, type TableColumn } from "@/shared/ui"
import type { JobTableContext, JobTableProps } from "../model/types"

import {
  JobStatusCell,
  JobPreviewCell,
  JobFileCell,
  JobCreatedCell,
  JobActionsCell,
} from "./cells"

export default function JobTable({
  jobs,
  loading,
  onSelectJob,
  onDeleteJob,
}: JobTableProps) {
  const columns: TableColumn<Job, JobTableContext>[] = [
    { key: "status", header: "Status", width: 120, render: (job) => <JobStatusCell job={job} /> },
    { key: "preview", header: "Preview", width: 80, render: (job) => <JobPreviewCell job={job} /> },
    { key: "file", header: "File", width: "auto", render: (job) => <JobFileCell job={job} /> },
    { key: "created", header: "Created", width: 180, render: (job) => <JobCreatedCell job={job} /> },
    {
      key: "actions",
      header: "",
      width: 120,
      align: "right",
      render: (job, ctx) => <JobActionsCell job={job} onDelete={ctx.onDeleteJob} />,
    },
  ]

  return (
    <Table
      rows={jobs}
      columns={columns}
      keyExtractor={(job) => job.id}
      loading={loading}
      onRowClick={onSelectJob}
      context={{ onDeleteJob }}
      emptyState="No jobs to display."
    />
  )
}
