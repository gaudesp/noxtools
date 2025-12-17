import { toolName as NoxsongizerName, Icon as NoxsongizerIcon, toolSlug as NoxsongizerSlug } from "@/features/noxsongizer"
import { toolName as NoxelizerName, Icon as NoxelizerIcon, toolSlug as NoxelizerSlug } from "@/features/noxelizer"
import { toolName as NoxtubizerName, Icon as NoxtubizerIcon, toolSlug as NoxtubizerSlug } from "@/features/noxtubizer/config"
import { toolName as NoxtunizerName, Icon as NoxtunizerIcon, toolSlug as NoxtunizerSlug } from "@/features/noxtunizer/config"
import { NavLink } from "react-router-dom"

export default function Sidebar() {
  const base = "block px-4 py-2 rounded-md text-sm font-medium transition-colors"
  const itemClass = (isActive: boolean) =>
    `${base} ${isActive ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-slate-800"} flex items-center gap-2`

  return (
    <aside className="sticky top-0 w-60 bg-slate-900 border-r border-slate-800 p-4 flex flex-col h-screen">
      <h1 className="mb-6 text-lg font-semibold">Noxtools</h1>
      <nav className="space-y-1">
        <NavLink
          to={`/${NoxsongizerSlug}`}
          className={({ isActive }) => itemClass(isActive)}
        >
          <NoxsongizerIcon />
          {NoxsongizerName}
        </NavLink>
        <NavLink
          to={`/${NoxelizerSlug}`}
          className={({ isActive }) => itemClass(isActive)}
        >
          <NoxelizerIcon />
          {NoxelizerName}
        </NavLink>
        <NavLink
          to={`/${NoxtubizerSlug}`}
          className={({ isActive }) => itemClass(isActive)}
        >
          <NoxtubizerIcon />
          {NoxtubizerName}
        </NavLink>
        <NavLink
          to={`/${NoxtunizerSlug}`}
          className={({ isActive }) => itemClass(isActive)}
        >
          <NoxtunizerIcon />
          {NoxtunizerName}
        </NavLink>
      </nav>

      <nav className="mt-auto space-y-1 pt-4.5 mb-1 border-t border-slate-800">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => itemClass(isActive)}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
            <circle cx="19" cy="6" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
            <circle cx="19" cy="18" r="1.5" />
          </svg>
          Dashboard
        </NavLink>
      </nav>
    </aside>
  )
}
