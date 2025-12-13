import Uploader from "@/shared/ui/Uploader"

type Props = {
  files: File[]
  disabled: boolean
  onChange: (files: File[]) => void
}

export default function AudioUploadField({ files, disabled, onChange }: Props) {
  function handleUpload(selected: File[]) {
    onChange(selected)
  }

  function handleRemove(file: File) {
    onChange(files.filter((f) => f !== file))
  }

  return (
    <Uploader
      files={files}
      onUpload={handleUpload}
      onRemoveFile={handleRemove}
      busy={disabled}
      accept="audio/*"
      title="Drag & drop audio files here"
      description="or click to choose one or multiple audio files from your computer"
      inputId="noxsongizer-uploader-input"
    />
  )
}
