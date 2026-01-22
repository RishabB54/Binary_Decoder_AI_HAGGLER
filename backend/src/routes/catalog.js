import { Router } from "express";
import { z } from "zod";
import { loadCatalog } from "../store/catalogStore.js";

export const catalogRouter = Router();

catalogRouter.get("/", async (req, res) => {
  const schema = z.object({ q: z.string().optional() });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_query" });
  }

  const { q } = parsed.data;
  const catalog = await loadCatalog();

  if (!q) {
    return res.json({ items: catalog.items.slice(0, 25) });
  }

  const needle = q.trim().toLowerCase();
  const items = catalog.items.filter((p) => {
    const hay = `${p.title} ${p.category} ${(p.tags || []).join(" ")}`.toLowerCase();
    return hay.includes(needle);
  });

  return res.json({ items: items.slice(0, 25) });
});
