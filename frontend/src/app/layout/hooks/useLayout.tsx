import { useContext } from "react"
import { LayoutContext } from "../providers/LayoutProvider"

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) {
    throw new Error("useLayout must be used inside <LayoutProvider>")
  }
  return ctx
}
