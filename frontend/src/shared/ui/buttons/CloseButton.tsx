type Props = {
  onClick: () => void
  label?: string
  disabled?: boolean
  className?: string
}

export default function CloseButton({
  onClick,
  label = "Close",
  disabled = false,
  className,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className ?? "",
      ].join(" ")}
    >
      {label}
    </button>
  )
}
