import { useMemo, useState } from "react"

type Options<T> = {
  getItemById?: (id: string | null) => T | null
}

export function useSelection<T>({ getItemById }: Options<T> = {}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedItem = useMemo(() => {
    if (!getItemById) return null
    return getItemById(selectedId)
  }, [getItemById, selectedId])

  return {
    selectedId,
    selectedItem,
    select: (id: string | null) => setSelectedId(id),
    clear: () => setSelectedId(null),
  }
}
