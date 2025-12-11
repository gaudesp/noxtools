import { useEffect, useMemo, useState } from "react"

type Options<T> = {
  items: T[]
  pageSize?: number
  initialPage?: number
}

export function usePaginatedData<T>({ items, pageSize = 10, initialPage = 1 }: Options<T>) {
  const [page, setPage] = useState(initialPage)

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const offset = (page - 1) * pageSize

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const pagedItems = useMemo(() => items.slice(offset, offset + pageSize), [items, offset, pageSize])

  return {
    page,
    pageSize,
    total,
    totalPages,
    offset,
    setPage,
    pagedItems,
  }
}
