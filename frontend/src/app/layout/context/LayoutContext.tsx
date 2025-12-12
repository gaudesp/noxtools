import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type { Job } from "@/entities/job/model"

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

  const updateHeader = useCallback((data: HeaderData) => {
    setHeader(data)
  }, [])

  const updateFooter = useCallback((jobs: Job[], loading?: boolean) => {
    setFooter({ jobs, loading })
  }, [])

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
