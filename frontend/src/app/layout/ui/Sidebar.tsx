import { NavLink } from "react-router-dom"

export default function Sidebar() {
  const base = "block px-4 py-2 rounded-md text-sm font-medium transition-colors"
  const itemClass = (isActive: boolean) =>
    `${base} ${isActive ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-slate-800"} flex items-center gap-2`

  const icons = {
    noxsongizer: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12c3-6 6 6 9 0s6 6 9 0" />
        <path d="M12 3v18" />
      </svg>
    ),
    noxelizer: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M7 8h0" />
        <path d="M10 8h0" />
        <path d="M7 11h0" />
        <path d="M10 11h0" />
        <path d="M13 8h4" />
        <path d="M13 12h3" />
      </svg>
    ),
    noxtubizer: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M10 9l4 3-4 3z" />
        <path d="M12 19v2" />
        <path d="M9 22h6" />
      </svg>
    ),
    noxtunizer: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12c1.5-3 3 3 4.5 0s3 3 4.5 0" />
        <circle cx="17" cy="12" r="3.5" />
        <path d="M19.5 14.5l2 2" />
      </svg>
    ),
    alljobs: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
        <circle cx="19" cy="6" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
        <circle cx="19" cy="18" r="1.5" />
      </svg>
    ),
  }

  return (
    <aside className="sticky top-0 w-60 bg-slate-900 border-r border-slate-800 p-4 flex flex-col h-screen">
      <h1 className="mb-6 text-lg font-semibold">Noxtools</h1>
      <nav className="space-y-1">
        <NavLink
          to="/noxsongizer"
          className={({ isActive }) => itemClass(isActive)}
        >
          {icons.noxsongizer}
          Noxsongizer
        </NavLink>
        <NavLink
          to="/noxelizer"
          className={({ isActive }) => itemClass(isActive)}
        >
          {icons.noxelizer}
          Noxelizer
        </NavLink>
        <NavLink
          to="/noxtubizer"
          className={({ isActive }) => itemClass(isActive)}
        >
          {icons.noxtubizer}
          Noxtubizer
        </NavLink>
        <NavLink
          to="/noxtunizer"
          className={({ isActive }) => itemClass(isActive)}
        >
          {icons.noxtunizer}
          Noxtunizer
        </NavLink>
      </nav>
    </aside>
  )
}
