import { createContext, useContext, useState, type ReactNode } from "react"
import type { Job } from "@/lib/api/core"

type HeaderData = {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
}

type FooterData = {
  jobs: Job[]
  loading?: boolean
}

type LayoutContextType = HeaderData &
  FooterData & {
    setHeader: (data: HeaderData) => void
    setFooter: (jobs: Job[], loading?: boolean) => void
  }

const LayoutContext = createContext<LayoutContextType | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<HeaderData>({
    title: "",
    description: "",
  })

  const [footer, setFooter] = useState<FooterData>({
    jobs: [],
    loading: false,
  })

  function updateHeader(data: HeaderData) {
    setHeader(data)
  }

  function updateFooter(jobs: Job[], loading?: boolean) {
    setFooter({ jobs, loading })
  }

  return (
    <LayoutContext.Provider
      value={{
        ...header,
        ...footer,
        setHeader: updateHeader,
        setFooter: updateFooter,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) {
    throw new Error("useLayout must be used inside <LayoutProvider>")
  }
  return ctx
}
