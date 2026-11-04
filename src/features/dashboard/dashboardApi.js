import { requestJson } from "../../lib/api.js";

export function getDashboardData() {
  let lowStockThreshold = 10;
  try {
    const stored = JSON.parse(localStorage.getItem("scentare-inventory-thresholds") || "null");
    if (Number.isInteger(stored?.low) && stored.low > 0) lowStockThreshold = stored.low;
  } catch { /* Use the inventory default when saved settings are invalid. */ }
  return requestJson(`dashboard.php?lowStockThreshold=${encodeURIComponent(lowStockThreshold)}`);
}
