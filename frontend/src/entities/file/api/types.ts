import type { StoredFile } from "../model/types"

export interface PaginatedFiles {
  items: StoredFile[]
  total: number
  limit: number
  offset: number
}

export interface ListFilesParams {
  q?: string
  type?: string
  limit?: number
  offset?: number
}
