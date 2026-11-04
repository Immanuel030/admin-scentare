import { requestJson } from "../../lib/api.js";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

export function getCategories() {
  return requestJson("categories.php");
}

export async function saveCategory(category) {
  const csrf = await csrfHeaders();
  return requestJson("categories.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify(category),
  });
}

export async function setCategoryArchived(id, archived) {
  const csrf = await csrfHeaders();
  return requestJson("categories.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify({ id, action: archived ? "archive" : "restore" }),
  });
}
