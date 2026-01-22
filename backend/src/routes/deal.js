import { Router } from "express";
import { z } from "zod";
import { acceptDealDraft } from "../store/sessionStore.js";

export const dealRouter = Router();

dealRouter.post("/accept", async (req, res) => {
  const schema = z.object({ sessionId: z.string(), dealId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body" });
  }

  const accepted = acceptDealDraft(parsed.data.sessionId, parsed.data.dealId);
  if (!accepted) {
    return res.status(404).json({ error: "deal_not_found" });
  }

  return res.json({ ok: true, accepted });
});
