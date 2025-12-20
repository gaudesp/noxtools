import type { TableProps } from "./types"
import Spinner from "../feedback/Spinner"

export function Table<T, TContext>({
  rows,
  columns,
  keyExtractor,
  onRowClick,
  emptyState,
  loading,
  error,
  context,
  className = "",
}: TableProps<T, TContext>) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full table-fixed border-collapse text-sm text-slate-200">
        <thead className="bg-slate-800/60 text-xs uppercase text-slate-400">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left"
                style={{ width: col.width }}
              >
                {col.header ?? null}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400">
                <Spinner size="sm" className="text-slate-400" ariaLabel="Loading" />
              </td>
            </tr>
          )}

          {error && !loading && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6">
                {error}
              </td>
            </tr>
          )}

          {!loading && !error && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">
                {emptyState ?? "No data."}
              </td>
            </tr>
          )}

          {!loading &&
            !error &&
            rows.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={`border-t border-slate-800 ${
                  onRowClick ? "hover:bg-slate-800/40 cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 align-middle text-${col.align ?? "left"}`}
                    style={{ width: col.width }}
                  >
                    {col.render(row, context)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
