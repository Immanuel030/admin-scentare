import { requestJson } from "../../lib/api.js";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

export async function loginAdmin(email, password) {
  const csrf = await csrfHeaders();
  const result = await requestJson("auth.php?action=login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify({ email, password }),
  });
  return result.user;
}

export async function getCurrentAdmin() {
  try {
    const result = await requestJson("auth.php?action=session");
    return result.user || null;
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export async function logoutAdmin() {
  const csrf = await csrfHeaders();
  return requestJson("auth.php?action=logout", {
    method: "POST",
    headers: csrf,
  });
}
