import type { ReactNode } from "react"

export type TableColumn<T, TContext = undefined> = {
  key: string
  header?: ReactNode
  width?: number | string
  align?: "left" | "center" | "right"
  render: (row: T, context: TContext) => ReactNode
}

export type TableProps<T, TContext = undefined> = {
  rows: T[]
  columns: TableColumn<T, TContext>[]
  keyExtractor: (row: T) => string

  loading?: boolean
  error?: ReactNode
  emptyState?: ReactNode

  onRowClick?: (row: T) => void
  context: TContext

  className?: string
}
