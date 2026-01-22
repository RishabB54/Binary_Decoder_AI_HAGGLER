/**
 * Session management routes
 * - Get session summary
 * - Get active deals
 * - Get purchase history
 */

import { Router } from "express";
import { z } from "zod";
import { 
  getSessionSummary, 
  getActiveDeals, 
  getPurchaseHistory 
} from "../store/sessionStore.js";

const router = Router();

/**
 * GET /session/:sessionId/summary
 * Get complete session summary
 */
router.get("/:sessionId/summary", (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const summary = getSessionSummary(sessionId);
    
    if (!summary) {
      return res.status(404).json({ 
        error: "Session not found" 
      });
    }

    res.json(summary);
  } catch (error) {
    console.error("[Session] Error getting summary:", error);
    res.status(500).json({ error: "Failed to get session summary" });
  }
});

/**
 * GET /session/:sessionId/deals
 * Get active deals for session
 */
router.get("/:sessionId/deals", (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const deals = getActiveDeals(sessionId);

    res.json({
      sessionId,
      deals,
      count: deals.length
    });
  } catch (error) {
    console.error("[Session] Error getting deals:", error);
    res.status(500).json({ error: "Failed to get deals" });
  }
});

/**
 * GET /session/:sessionId/purchases
 * Get purchase history for session
 */
router.get("/:sessionId/purchases", (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const purchases = getPurchaseHistory(sessionId);

    res.json({
      sessionId,
      purchases,
      count: purchases.length,
      totalValue: purchases.reduce((sum, p) => sum + p.offer.finalTotal, 0)
    });
  } catch (error) {
    console.error("[Session] Error getting purchases:", error);
    res.status(500).json({ error: "Failed to get purchase history" });
  }
});

export default router;
