export type FileVariant = {
  id: string
  label: string
  format?: string | null
  quality?: string | number | null
}

export type StoredFile = {
  id: string
  type: string
  name: string
  checksum: string
  size: number
  path: string
  created_at: string
  format?: string | null
  quality?: string | number | null
  variants?: FileVariant[] | null
}

export type JobFileRole = "input" | "output"

export type JobFileLink = {
  file: StoredFile
  role: JobFileRole
  label?: string | null
}
