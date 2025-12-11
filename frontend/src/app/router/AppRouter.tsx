import { Route, Routes } from "react-router-dom"
import { AppLayout } from "@/app/layout"
import { routes } from "@/app/router/routes"

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>
    </Routes>
  )
}
