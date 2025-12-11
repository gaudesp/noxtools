import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
