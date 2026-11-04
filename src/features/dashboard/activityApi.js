import { requestJson } from "../../lib/api.js";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

export function getActivity({ page = 1, admin = "", module = "", search = "", exportAll = false }) {
  const params = new URLSearchParams({ page: String(page), admin, module, search });
  if (exportAll) params.set("export", "1");
  return requestJson(`activity.php?${params.toString()}`);
}

export async function recordActivity({ module, action, details = "" }) {
  try {
    const csrf = await csrfHeaders();
    return await requestJson("activity.php", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrf },
      body: JSON.stringify({ module, action, details }),
    });
  } catch {
    // Auditing should not disrupt the admin task if logging is temporarily unavailable.
  }
}
