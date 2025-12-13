import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"
import Footer from "./Footer"
import { useLayout } from "../model/store"

export default function AppLayout() {
  const { title, description, eyebrow, actions, jobs, loading } = useLayout()

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />

      <div className="flex flex-col flex-1 min-h-screen">
        
        <header className="p-6 pb-0">
          <Header
            title={title}
            description={description}
            eyebrow={eyebrow}
            actions={actions}
          />
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>

        <Footer jobs={jobs} loading={loading} />
      </div>
    </div>
  )
}
