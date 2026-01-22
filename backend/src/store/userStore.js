import fs from "fs/promises";
import path from "path";

let cached = null;

export async function loadUsers() {
  if (cached) return cached;
  const p = path.join(process.cwd(), "src", "data", "users.json");
  const raw = await fs.readFile(p, "utf-8");
  cached = JSON.parse(raw);
  return cached;
}
