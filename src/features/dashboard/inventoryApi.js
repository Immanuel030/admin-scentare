import { requestJson } from "../../lib/api.js";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

export function getInventoryThresholds() {
  return requestJson("inventory.php");
}

export async function saveInventoryThresholds({ low, critical }) {
  const csrf = await csrfHeaders();
  return requestJson("inventory.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify({ low, critical }),
  });
}
