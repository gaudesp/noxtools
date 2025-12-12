type Props = {
  disabled: boolean
  onClick: () => void
}

export default function ResetButton({ disabled, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-sm text-slate-300 hover:text-white underline-offset-4 underline disabled:opacity-50"
    >
      Reset
    </button>
  )
}
