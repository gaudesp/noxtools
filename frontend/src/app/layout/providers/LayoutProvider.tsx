import { createContext, useContext, useState, type ReactNode } from "react"
import { type Job } from "../../../lib/api/core"

type LayoutContextType = {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
  setHeader: (data: {
    title: string
    description: string
    eyebrow?: string
    actions?: ReactNode
  }) => void
  jobs: Job[]
  loading?: boolean
  setFooterJobs: (jobs: Job[], loading?: boolean) => void
}

export const LayoutContext = createContext<LayoutContextType | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [header, setHeaderState] = useState<{
    title: string
    description: string
    eyebrow?: string
    actions?: ReactNode
  }>({
    title: "",
    description: "",
  })

  const [footerData, setFooterState] = useState<{
    jobs: Job[]
    loading?: boolean
  }>({
    jobs: [],
    loading: false,
  })

  function setHeader(data: LayoutContextType["setHeader"] extends (arg: infer A) => void ? A : never) {
    setHeaderState(data)
  }

  function setFooterJobs(jobs: Job[], loading?: boolean) {
    setFooterState({ jobs, loading })
  }

  return (
    <LayoutContext.Provider
      value={{
        title: header.title,
        description: header.description,
        eyebrow: header.eyebrow,
        actions: header.actions,
        setHeader,
        jobs: footerData.jobs,
        loading: footerData.loading,
        setFooterJobs,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayoutContext() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error("useLayoutContext must be used inside <LayoutProvider>")
  return ctx
}
