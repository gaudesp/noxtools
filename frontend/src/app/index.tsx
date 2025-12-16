import { AppRouter } from "@/app/router"
import { LayoutProvider } from "@/shared/providers/layout"

export default function App() {
  return (
    <LayoutProvider>
      <AppRouter />
    </LayoutProvider>
  )
}
