import { AppRouter } from "./router"
import { LayoutProvider } from "./layout/context/LayoutContext"

export default function App() {
  return (
    <LayoutProvider>
      <AppRouter />
    </LayoutProvider>
  )
}
