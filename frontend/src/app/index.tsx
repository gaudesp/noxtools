import { AppRouter } from "@/app/router"
import { LayoutProvider } from "@/app/layout/model"

export default function App() {
  return (
    <LayoutProvider>
      <AppRouter />
    </LayoutProvider>
  )
}
