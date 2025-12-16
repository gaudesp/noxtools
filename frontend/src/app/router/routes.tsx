import { Navigate } from "react-router-dom"
import {
  DashboardPage,
  NoxsongizerPage,
  NoxelizerPage,
  NoxtubizerPage,
  NoxtunizerPage,
} from "@/pages"

export const routes = [
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/noxsongizer", element: <NoxsongizerPage /> },
  { path: "/noxelizer", element: <NoxelizerPage /> },
  { path: "/noxtubizer", element: <NoxtubizerPage /> },
  { path: "/noxtunizer", element: <NoxtunizerPage /> },
]
