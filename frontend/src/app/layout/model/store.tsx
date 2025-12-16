import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type LayoutHeader = {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
}

export type LayoutJobStatus = "pending" | "running" | "done" | "error"

export type LayoutJobSummary = {
  status: LayoutJobStatus
}

export type LayoutFooter = {
  jobs: LayoutJobSummary[]
  loading?: boolean
}

type LayoutStore = LayoutHeader &
  LayoutFooter & {
    setHeader: (data: LayoutHeader) => void
    setFooter: (jobs: LayoutJobSummary[], loading?: boolean) => void
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

  const setFooterData = useCallback((jobs: LayoutJobSummary[], loading?: boolean) => {
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
