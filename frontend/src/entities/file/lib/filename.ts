const KNOWN_SUFFIXES = [
  "_audio",
  "_video",
  "_both",
  "_image",
  "_pixelate",
  "_vocals",
  "_other",
  "_bass",
  "_drums",
]

const LABEL_MAP: Record<string, string> = {
  audio: "Audio",
  video: "Video",
  both: "Both",
  image: "Image",
  pixelate: "Pixelate",
  vocals: "Vocals",
  other: "Other",
  bass: "Bass",
  drums: "Drums",
}

const LABEL_PREFIX = /^\s*\[[^\]]+]\s*/i

function stripLabelPrefix(name: string): string {
  return name.replace(LABEL_PREFIX, "")
}

function splitName(name: string): { base: string; ext: string } {
  const idx = name.lastIndexOf(".")
  if (idx <= 0) {
    return { base: name, ext: "" }
  }
  return { base: name.slice(0, idx), ext: name.slice(idx) }
}

export function getFileSuffixToken(name?: string | null): string | null {
  if (!name) return null
  const cleaned = stripLabelPrefix(name)
  const { base } = splitName(cleaned)
  const lower = base.toLowerCase()
  for (const suffix of KNOWN_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      return suffix.replace(/^_/, "")
    }
  }
  return null
}

export function getFileLabel(name?: string | null): string | null {
  const token = getFileSuffixToken(name)
  if (!token) return null
  return LABEL_MAP[token] ?? `${token.charAt(0).toUpperCase()}${token.slice(1)}`
}

export function cleanFileName(name?: string | null): string {
  if (!name) return ""
  const cleaned = stripLabelPrefix(name)
  const { base, ext } = splitName(cleaned)
  const lower = base.toLowerCase()
  let trimmed = base
  for (const suffix of KNOWN_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      trimmed = base.slice(0, base.length - suffix.length)
      break
    }
  }
  const resolved = trimmed || base || cleaned
  return `${resolved}${ext}`
}
