import { NavLink } from "react-router-dom";

function Sidebar() {
  const base =
    "block px-4 py-2 rounded-md text-sm font-medium transition-colors";
  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 p-4">
      <h1 className="mb-6 text-lg font-semibold">Noxtools</h1>
      <nav className="space-y-1">
        <NavLink
          to="/noxsongizer"
          className={({ isActive }) =>
            `${base} ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          Noxsongizer
        </NavLink>
        <NavLink
          to="/noxelizer"
          className={({ isActive }) =>
            `${base} ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          Noxelizer
        </NavLink>
        <NavLink
          to="/noxtubizer"
          className={({ isActive }) =>
            `${base} ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          Noxtubizer
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
