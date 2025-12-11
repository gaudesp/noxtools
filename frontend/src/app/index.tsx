import { AppRouter } from "./router"
import { LayoutProvider } from "./layout/providers/LayoutProvider"

export default function App() {
  return (
    <LayoutProvider>
      <AppRouter />
    </LayoutProvider>
  )
}
