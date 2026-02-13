const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  ""
);

export async function fetchHealth() {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) {
    throw new Error("Health check failed");
  }
  return response.json();
}
