import { requestJson } from "../../lib/api.js";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

export function getOrders({ page = 1, status = "all", search = "", exportAll = false }) {
  const params = new URLSearchParams({ page: String(page), status, search });
  if (exportAll) params.set("export", "1");
  return requestJson(`orders.php?${params.toString()}`);
}

export function getOrderDetails(id) {
  return requestJson(`orders.php?id=${encodeURIComponent(id)}`);
}

export async function updateOrderStatus(id, status) {
  const csrf = await csrfHeaders();
  return requestJson("orders.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify({ action: "update_status", id, status }),
  });
}

export async function assignRider(id, riderId) {
  const csrf = await csrfHeaders();
  return requestJson("orders.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify({ action: "assign_rider", id, rider_id: riderId }),
  });
}
