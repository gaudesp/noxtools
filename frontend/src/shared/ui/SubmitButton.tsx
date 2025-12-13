type Props = {
  loading: boolean
  onClick: () => void
  label: string
}

export default function SubmitButton({ loading, onClick, label }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-60"
    >
      {loading ? "Queuing…" : label}
    </button>
  )
}
