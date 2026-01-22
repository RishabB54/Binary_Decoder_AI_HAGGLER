import fs from "fs";
import path from "path";

let cached = null;

export function loadInventory() {
  if (cached) return cached;
  const p = path.join(process.cwd(), "src", "data", "inventory.json");
  const raw = fs.readFileSync(p, "utf-8");
  cached = JSON.parse(raw);
  return cached;
}
