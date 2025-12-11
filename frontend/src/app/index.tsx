import { AppRouter } from "@/app/router"
import { LayoutProvider } from "@/app/layout/context/LayoutContext"

export default function App() {
  return (
    <LayoutProvider>
      <AppRouter />
    </LayoutProvider>
  )
}
