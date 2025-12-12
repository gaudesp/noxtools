import { Navigate } from "react-router-dom"
import Noxelizer from "@/pages/noxelizer/Page"
import Noxsongizer from "@/pages/noxsongizer/Page"
import Noxtubizer from "@/pages/noxtubizer/Page"
import Noxtunizer from "@/pages/noxtunizer/Page"
// import Dashboard from "@/features/dashboard/pages/DashboardPage"

export const routes = [
  { path: "/", element: <Navigate to="/noxsongizer" replace /> },
  { path: "/noxsongizer", element: <Noxsongizer /> },
  { path: "/noxelizer", element: <Noxelizer /> },
  { path: "/noxtubizer", element: <Noxtubizer /> },
  { path: "/noxtunizer", element: <Noxtunizer /> },
  // { path: "/dashboard", element: <Dashboard /> },
]
