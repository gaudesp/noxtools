import { useEffect, useState } from "react";
import { API_BASE_URL } from "../lib/api";

type HealthStatus = {
  status: string;
  service: string;
} | null;

function Noxsongizer() {
  const [health, setHealth] = useState<HealthStatus>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/noxsongizer/health`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as HealthStatus;
        setHealth(data);
      } catch (err) {
        setError("Impossible de joindre l'API Noxsongizer");
      }
    };

    fetchHealth();
  }, []);

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Noxsongizer</h2>
      <p className="text-sm text-slate-300 mb-4">
        Interface à venir pour séparer les pistes audio avec Demucs.
      </p>

      <div className="inline-flex items-center gap-2 rounded-md border border-slate-800 px-3 py-2 text-xs">
        <span className="font-semibold text-slate-200">API status :</span>
        {error && <span className="text-red-400">{error}</span>}
        {!error && !health && (
          <span className="text-slate-400">Vérification en cours…</span>
        )}
        {health && !error && (
          <span className="text-emerald-400">
            {health.service} → {health.status}
          </span>
        )}
      </div>
    </section>
  );
}

export default Noxsongizer;
