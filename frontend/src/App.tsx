import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Noxsongizer from "./pages/Noxsongizer";
import Noxelizer from "./pages/Noxelizer";
import Noxtubizer from "./pages/Noxtubizer";
import Noxtunizer from "./pages/Noxtunizer";
import AllJobs from "./pages/AllJobs";

function App() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/noxsongizer" replace />} />
          <Route path="/noxsongizer" element={<Noxsongizer />} />
          <Route path="/noxelizer" element={<Noxelizer />} />
          <Route path="/noxtubizer" element={<Noxtubizer />} />
          <Route path="/noxtunizer" element={<Noxtunizer />} />
          <Route path="/jobs" element={<AllJobs />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
