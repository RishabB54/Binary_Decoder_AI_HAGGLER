import { Router } from "express";
import { z } from "zod";
import { bargainAgent } from "../agent/bargainAgent.js";

export const chatRouter = Router();

chatRouter.post("/", async (req, res) => {
  const schema = z.object({
    userId: z.string(),
    sessionId: z.string().optional(),
    message: z.string()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_body" });
  }

  try {
    const result = await bargainAgent(parsed.data);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: "chat_failed" });
  }
});
