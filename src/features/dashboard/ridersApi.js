import { requestJson } from "../../lib/api.js";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

export function getRiders({ status, search }) {
  const params = new URLSearchParams({ status, search });
  return requestJson(`riders.php?${params.toString()}`);
}

export async function saveRider(rider) {
  const csrf = await csrfHeaders();
  return requestJson("riders.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify(rider),
  });
}

export async function setRiderActive(id, active) {
  const csrf = await csrfHeaders();
  return requestJson("riders.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify({ id, action: active ? "activate" : "deactivate" }),
  });
}

export async function resetRiderPassword(id, password) {
  const csrf = await csrfHeaders();
  return requestJson("riders.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify({ id, password, action: "reset_password" }),
  });
}
