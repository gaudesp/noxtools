type SpinnerSize = "xs" | "sm" | "md" | "lg" | number

type Props = {
  size?: SpinnerSize
  className?: string
  label?: string
  labelClassName?: string
  ariaLabel?: string
}

const SIZE_MAP: Record<Exclude<SpinnerSize, number>, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
}

export default function Spinner({
  size = "sm",
  className,
  label,
  labelClassName,
  ariaLabel,
}: Props) {
  const dimension = typeof size === "number" ? size : SIZE_MAP[size]
  const accessibleLabel = ariaLabel || label || "Loading"

  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
      role="status"
      aria-label={accessibleLabel}
    >
      <span
        className="inline-block rounded-full border border-current border-t-transparent animate-spin"
        style={{ width: dimension, height: dimension }}
        aria-hidden
      />
      {label ? <span className={labelClassName}>{label}</span> : null}
    </span>
  )
}
