import {
  type Job,
  type NoxtubizerJob,
  type NoxtubizerJobResult,
  type NoxtubizerMode,
} from "@/features/noxtubizer/api"

export function isNoxtubizerJob(job: Job): boolean {
  return job.tool === "noxtubizer"
}

export function getNoxtubizerResult(job: Job): NoxtubizerJobResult | null {
  if (!isNoxtubizerJob(job)) return null
  return (job as NoxtubizerJob).result ?? null
}

export function getNoxtubizerMode(job: Job): NoxtubizerMode {
  const result = getNoxtubizerResult(job)
  const raw = job.params?.mode as string | undefined
  const mode = (raw || result?.mode || "audio").toLowerCase()

  if (mode === "audio" || mode === "video" || mode === "both") return mode
  return "audio"
}
