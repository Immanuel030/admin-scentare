import { requestJson } from "../../lib/api.js";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

export function getCustomers({ page, status, search }) {
  const params = new URLSearchParams({ page: String(page), status, search });
  return requestJson(`customers.php?${params.toString()}`);
}

export async function setCustomerActive(id, active) {
  const csrf = await csrfHeaders();
  return requestJson("customers.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify({ id, action: active ? "activate" : "suspend" }),
  });
}
