const API_BASE_URL = "http://localhost:8000/api";

export { API_BASE_URL };

export async function uploadNoxsongizer(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}/noxsongizer/upload`, {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function getNoxsongizerStatus(jobId: string) {
  const res = await fetch(`${API_BASE_URL}/noxsongizer/status/${jobId}`);
  return res.json();
}
