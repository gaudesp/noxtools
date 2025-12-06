import { useState } from "react";
import { uploadNoxsongizer, getNoxsongizerStatus } from "../lib/api";

export default function Noxsongizer() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;

    const res = await uploadNoxsongizer(file);
    setJobId(res.job_id);

    // Fetch status once (polling later)
    const statusRes = await getNoxsongizerStatus(res.job_id);
    setStatus(statusRes.status);
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Noxsongizer</h1>

      {/* FILE INPUT */}
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-purple-600 rounded"
      >
        Upload
      </button>

      {/* JOB INFO */}
      {jobId && (
        <div className="mt-6 bg-neutral-800 p-4 rounded">
          <p>Job ID : {jobId}</p>
          <p>Status : {status}</p>
        </div>
      )}
    </div>
  );
}
