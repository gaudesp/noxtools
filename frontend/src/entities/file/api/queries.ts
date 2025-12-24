import { API_BASE_URL, handleResponse } from "@/shared/api"
import type { ListFilesParams, PaginatedFiles } from "./types"

type FileContentVariant = "thumb"

export async function listFiles(
  params: ListFilesParams = {},
): Promise<PaginatedFiles> {
  const search = new URLSearchParams()

  if (params.q) search.set("q", params.q)
  if (params.type) search.set("type", params.type)
  if (typeof params.limit === "number") search.set("limit", String(params.limit))
  if (typeof params.offset === "number") search.set("offset", String(params.offset))

  const res = await fetch(`${API_BASE_URL}/files?${search.toString()}`)
  return handleResponse<PaginatedFiles>(res)
}

export function getFileContentUrl(
  fileId: string,
  opts: { variant?: FileContentVariant } = {},
): string {
  const url = new URL(`${API_BASE_URL}/files/${fileId}/content`)
  if (opts.variant) url.searchParams.set("variant", opts.variant)
  return url.toString()
}
