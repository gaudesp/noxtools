import type { Job } from "@/entities/job"
import { Table, type TableColumn } from "@/shared/ui"
import type { JobTableContext, JobTableProps } from "../model/types"

import {
  JobStatusCell,
  JobToolCell,
  JobPreviewCell,
  JobFileCell,
  JobCreatedCell,
  JobStartedCell,
  JobCompletedCell,
  JobActionsCell,
} from "./cells"

export default function JobTable({
  jobs,
  loading,
  onSelectJob,
  onDeleteJob,
  toolColor,
  showToolColumn = false,
}: JobTableProps) {
  const columns: TableColumn<Job, JobTableContext>[] = [
    ...(showToolColumn && toolColor
      ? [{
          key: "tool",
          header: "Tool",
          width: 140,
          render: (job, ctx) =>
            ctx.toolColor ? (
              <JobToolCell job={job} toolColor={ctx.toolColor} />
            ) : null,
        } as TableColumn<Job, JobTableContext>]
      : []),
    { key: "status", header: "Status", width: 100, render: (job) => <JobStatusCell job={job} /> },
    { key: "preview", header: "Preview", width: 80, render: (job) => <JobPreviewCell job={job} /> },
    { key: "file", header: "File", width: "auto", render: (job) => <JobFileCell job={job} /> },
    { key: "created", header: "Created", width: 160, render: (job) => <JobCreatedCell job={job} /> },
    { key: "started", header: "Started", width: 160, render: (job) => <JobStartedCell job={job} /> },
    { key: "completed", header: "Completed", width: 160, render: (job) => <JobCompletedCell job={job} /> },
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
      context={{ onDeleteJob, toolColor }}
      emptyState="No jobs to display."
    />
  )
}
