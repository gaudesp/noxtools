type Props = {
  disabled?: boolean
  onClick: () => void
  label?: string
}

export default function ResetButton({
  disabled = false,
  onClick,
  label = "Reset",
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-sm underline underline-offset-4 text-slate-300 hover:text-white disabled:opacity-50"
    >
      {label}
    </button>
  )
}
