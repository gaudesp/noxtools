import { type ReactNode } from "react"

type Props = {
  children: ReactNode
  className?: string
}

export default function Tag({
  children,
  className = "",
}: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-tight ${className}`}
    >
      {children}
    </span>
  )
}
