import { API_BASE_URL, handleResponse } from "@/shared/api"
import {
  listJobs,
  type PaginatedJobs,
  type ListJobsParams,
} from "@/entities/job/api"

import {
  type NoxtunizerCreateRequest,
  type NoxtunizerUploadResponse,
} from "./types"

export async function createNoxtunizerJob(
  payload: NoxtunizerCreateRequest,
): Promise<NoxtunizerUploadResponse> {
  const form = new FormData()
  payload.files.forEach((file) => form.append("files", file))

  const res = await fetch(`${API_BASE_URL}/noxtunizer/jobs`, {
    method: "POST",
    body: form,
  })

  return handleResponse<NoxtunizerUploadResponse>(res)
}

export async function listNoxtunizerJobs(
  params: Omit<ListJobsParams, "tool"> = {},
): Promise<PaginatedJobs> {
  return listJobs({ ...params, tool: "noxtunizer" })
}

export function getNoxtunizerSourceUrl(jobId: string): string {
  return `${API_BASE_URL}/noxtunizer/source/${jobId}`
}
