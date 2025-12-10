import { type Job, getNoxtunizerSourceUrl } from "../../lib/api";
import ErrorMessage from "../common/ErrorMessage";

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

export default function NoxtunizerResultPreview({ job }: { job: Job }) {
  if (job.tool !== "noxtunizer") return null;

  if (job.status === "pending")
    return <p className="text-sm text-slate-200">Job queued, starting soon…</p>;

  if (job.status === "running")
    return <p className="text-sm text-slate-200">Analyzing audio with Essentia…</p>;

  if (job.status === "error") {
    return (
      <ErrorMessage
        title="Job failed"
        message="The analysis could not be completed."
        details={job.error_message}
      />
    );
  }

  if (job.status === "done") {
    const result = job.result || {
      bpm: null,
      key: null,
      duration_label: "—",
    };

    const sourceUrl = getNoxtunizerSourceUrl(job.id);

    const blocks = [
      { label: "BPM", value: displayValue(result.bpm) },
      { label: "KEY", value: displayValue(result.key) },
      { label: "DURATION", value: displayValue(result.duration_label) },
    ];

    return (
      <div className="space-y-4">
        <div className="border border-slate-800 rounded-lg bg-slate-900 p-3">
          <p className="text-sm font-semibold mb-3">Audio</p>
          <audio controls className="w-full">
            <source src={sourceUrl} />
            Your browser does not support the audio element.
          </audio>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {blocks.map((block) => (
            <div
              key={block.label}
              className="border border-slate-800 rounded-lg bg-slate-900 p-3"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                {block.label}
              </p>
              <p className="text-lg font-semibold text-slate-50">{block.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <p className="text-sm text-slate-200">No details available.</p>;
}
