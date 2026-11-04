export const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";

export async function requestJson(path, options = {}) {
  const response = await fetch(`${apiBase}/${path}`, {
    credentials: "include",
    ...options,
  });
  const result = await response.json();

  if (!response.ok) {
    const error = new Error(result.message || "The request could not be completed.");
    error.status = response.status;
    throw error;
  }

  return result;
}
