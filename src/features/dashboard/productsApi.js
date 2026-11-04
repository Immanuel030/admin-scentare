import { requestJson } from "../../lib/api.js";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

export function getProductsData() {
  return requestJson("products.php");
}

export async function saveProduct(product) {
  const csrf = await csrfHeaders();
  return requestJson("products.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify(product),
  });
}

export async function setProductArchived(id, archived) {
  const csrf = await csrfHeaders();
  return requestJson("products.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify({ id, action: archived ? "archive" : "restore" }),
  });
}

export async function restockProduct(id, quantity) {
  const csrf = await csrfHeaders();
  return requestJson("products.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify({ id, quantity, action: "restock" }),
  });
}
