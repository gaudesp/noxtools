import { Navigate } from "react-router-dom"
import {
  NoxsongizerPage,
  NoxelizerPage,
  NoxtubizerPage,
  NoxtunizerPage,
} from "@/pages"

export const routes = [
  { path: "/", element: <Navigate to="/noxsongizer" replace /> },
  { path: "/noxsongizer", element: <NoxsongizerPage /> },
  { path: "/noxelizer", element: <NoxelizerPage /> },
  { path: "/noxtubizer", element: <NoxtubizerPage /> },
  { path: "/noxtunizer", element: <NoxtunizerPage /> },
]
