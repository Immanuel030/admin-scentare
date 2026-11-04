import { requestJson } from "../../lib/api.js";

async function csrfHeaders() {
  const { token } = await requestJson("auth.php?action=csrf");
  return { "X-CSRF-TOKEN": token };
}

export function getReviews({ page = 1, status = "all", search = "" }) {
  const params = new URLSearchParams({ page: String(page), status, search });
  return requestJson(`reviews.php?${params.toString()}`);
}

export async function moderateReview(id, action) {
  const csrf = await csrfHeaders();
  return requestJson("reviews.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...csrf },
    body: JSON.stringify({ id, action }),
  });
}
