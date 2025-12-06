import { useState, useEffect } from "react"
import { uploadNoxsongizer, getNoxsongizerStatus } from "../lib/api"

export default function Noxsongizer() {
  const [file, setFile] = useState<File | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  // ----------------------------
  // Polling logic
  // ----------------------------
  useEffect(() => {
    if (!jobId) return

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      const res = await getNoxsongizerStatus(jobId)
      setStatus(res.status)

      if (res.status === "done" || res.status === "error") {
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [jobId])

  // ----------------------------
  // Handle file upload
  // ----------------------------
  async function handleUpload() {
    if (!file) return

    const res = await uploadNoxsongizer(file)
    setJobId(res.job_id)
    setStatus("pending") // initial state while polling starts
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Noxsongizer</h1>

      {/* File input */}
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      {/* Upload button */}
      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-purple-600 rounded"
      >
        Upload
      </button>

      {/* Job info */}
      {jobId && (
        <div className="mt-6 bg-neutral-800 p-4 rounded">
          <p>Job ID : {jobId}</p>
          <p>Status : {status}</p>
        </div>
      )}
    </div>
  )
}
