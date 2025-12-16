import { Uploader } from "@/shared/ui"

type Props = {
  files: File[]
  disabled: boolean
  onChange: (files: File[]) => void
}

export default function ImageUploadField({
  files,
  disabled,
  onChange,
}: Props) {
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
      accept="image/*"
      title="Drag & drop images here"
      description="or click to choose one or multiple images from your computer"
      inputId="noxelizer-uploader-input"
    />
  )
}
