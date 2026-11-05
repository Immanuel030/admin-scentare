export const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";

// Where the customer shop (Laravel app) serves its public storage from —
// used to preview/display images that were uploaded as a relative path
// (e.g. "products/xxxx.jpg") instead of a full external URL.
export const shopBase = import.meta.env.VITE_SHOP_URL || "http://127.0.0.1:8000";

export function resolveImageUrl(image) {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return `${shopBase.replace(/\/$/, "")}/storage/${image.replace(/^\/+/, "")}`;
}

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
