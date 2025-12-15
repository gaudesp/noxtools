import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Job } from "@/entities/job"

export type LayoutHeader = {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
}

export type LayoutFooter = {
  jobs: Job[]
  loading?: boolean
}

type LayoutStore = LayoutHeader &
  LayoutFooter & {
    setHeader: (data: LayoutHeader) => void
    setFooter: (jobs: Job[], loading?: boolean) => void
  }

const Store = createContext<LayoutStore | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<LayoutHeader>({
    title: "",
    description: "",
  })

  const [footer, setFooter] = useState<LayoutFooter>({
    jobs: [],
    loading: false,
  })

  const setHeaderData = useCallback((data: LayoutHeader) => {
    setHeader(data)
  }, [])

  const setFooterData = useCallback((jobs: Job[], loading?: boolean) => {
    setFooter({ jobs, loading })
  }, [])

  return (
    <Store.Provider
      value={{
        ...header,
        ...footer,
        setHeader: setHeaderData,
        setFooter: setFooterData,
      }}
    >
      {children}
    </Store.Provider>
  )
}

export function useLayout() {
  const store = useContext(Store)
  if (!store) {
    throw new Error("Layout store is not available. Wrap your app with <LayoutProvider>.")
  }
  return store
}
