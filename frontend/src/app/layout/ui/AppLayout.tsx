import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import Header from "./Header"
import Footer from "./Footer"
import { useLayout } from "@/app/layout"

export default function AppLayout() {
  const { title, description, eyebrow, eyebrowClassName, actions, jobs, loading } = useLayout()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50">
      <Sidebar />

      <div className="flex flex-col flex-1 h-screen min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 pb-0">
            <Header
              title={title}
              description={description}
              eyebrow={eyebrow}
              eyebrowClassName={eyebrowClassName}
              actions={actions}
            />
          </div>

          <div className="p-6">
            <Outlet />
          </div>
        </main>

        <Footer jobs={jobs} loading={loading} />
      </div>
    </div>
  )
}
