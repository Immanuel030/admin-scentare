import { requestJson } from "../../lib/api.js";

export function getReports(days) {
  return requestJson(`reports.php?days=${encodeURIComponent(days)}`);
}
