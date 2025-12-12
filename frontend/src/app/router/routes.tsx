import { Navigate } from "react-router-dom"
import Noxelizer from "@/pages/noxelizer/NoxelizerPage"
import Noxsongizer from "@/pages/noxsongizer/NoxsongizerPage"
import Noxtubizer from "@/pages/noxtubizer/NoxtubizerPage"
import Noxtunizer from "@/pages/noxtunizer/NoxtunizerPage"
// import Dashboard from "@/features/dashboard/pages/DashboardPage"

export const routes = [
  { path: "/", element: <Navigate to="/noxsongizer" replace /> },
  { path: "/noxsongizer", element: <Noxsongizer /> },
  { path: "/noxelizer", element: <Noxelizer /> },
  { path: "/noxtubizer", element: <Noxtubizer /> },
  { path: "/noxtunizer", element: <Noxtunizer /> },
  // { path: "/dashboard", element: <Dashboard /> },
]
