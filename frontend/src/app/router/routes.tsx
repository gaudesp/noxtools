import { Navigate } from "react-router-dom"
import AllJobs from "../../features/jobs/pages/AllJobsPage"
import Noxelizer from "../../features/noxelizer/pages/NoxelizerPage"
import Noxsongizer from "../../features/noxsongizer/pages/NoxsongizerPage"
import Noxtubizer from "../../features/noxtubizer/pages/NoxtubizerPage"
import Noxtunizer from "../../features/noxtunizer/pages/NoxtunizerPage"

export const routes = [
  { path: "/", element: <Navigate to="/noxsongizer" replace /> },
  { path: "/noxsongizer", element: <Noxsongizer /> },
  { path: "/noxelizer", element: <Noxelizer /> },
  { path: "/noxtubizer", element: <Noxtubizer /> },
  { path: "/noxtunizer", element: <Noxtunizer /> },
  { path: "/jobs", element: <AllJobs /> },
]
