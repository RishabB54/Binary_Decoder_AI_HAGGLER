import { Router } from "express";
import { z } from "zod";
import { bargainAgent } from "../agent/bargainAgent.js";

export const chatRouter = Router();

chatRouter.post("/", async (req, res) => {
  console.log("📨 [Chat] Received message:", req.body.message);
  
  const schema = z.object({
    userId: z.string(),
    sessionId: z.string().optional().nullable(),
    message: z.string()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    console.error("❌ [Chat] Invalid request body:", parsed.error);
    return res.status(400).json({ error: "invalid_body" });
  }

  try {
    const result = await bargainAgent(parsed.data);
    console.log("✅ [Chat] Success! Reply:", result.replyText?.substring(0, 100) + "...");
    return res.json(result);
  } catch (e) {
    console.error("❌ [Chat] Route error:", e);
    console.error("❌ [Chat] Stack:", e.stack);
    return res.status(500).json({ 
      error: "chat_failed",
      replyText: "Sorry, I'm having trouble right now. Please try again!",
      haggleScore: 0.1,
      dealDraft: null
    });
  }
});
