/**
 * Image Search Routes
 * Handles user-uploaded image search for visual product matching
 */

import { Router } from "express";
import multer from "multer";
import { searchByImage } from "../agent/imageSearch.js";

export const imageSearchRouter = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit (Gemini supports up to 20MB)
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      // Log file details
      console.log(`📸 [Image Upload] File: ${file.originalname}, Type: ${file.mimetype}, Size: ${file.size} bytes`);
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/image-search
 * Search products by uploaded image
 */
imageSearchRouter.post("/", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: "no_image", 
        message: "Please upload an image file" 
      });
    }

    console.log(`📸 [Image Search] Received image: ${req.file.originalname} (${req.file.size} bytes)`);

    // Analyze uploaded image and find similar products
    const results = await searchByImage(req.file.buffer, req.file.mimetype);

    console.log(`📊 [Image Search] Final results count: ${results?.length || 0}`);

    if (!results || results.length === 0) {
      console.log("⚠️  [Image Search] No results found - check logs above for details");
      return res.status(404).json({
        error: "no_matches",
        message: "No similar products found. The image analysis API may be experiencing issues. Try searching by text instead.",
        items: [],
        debug: {
          hint: "Gemini Image API returned 500 error - this may be an API-side issue",
          suggestion: "Try using text search: 'show kurta' or 'show jeans'"
        }
      });
    }

    return res.json({
      success: true,
      query: "visual_search",
      items: results,
      count: results.length
    });

  } catch (error) {
    console.error("❌ [Image Search] Error:", error.message);
    return res.status(500).json({
      error: "search_failed",
      message: error.message || "Image search failed. Please try again."
    });
  }
});

/**
 * POST /api/image-search/analyze
 * Just analyze image without searching (for testing)
 */
imageSearchRouter.post("/analyze", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: "no_image", 
        message: "Please upload an image file" 
      });
    }

    const { analyzeUploadedImage } = await import("../agent/imageSearch.js");
    const analysis = await analyzeUploadedImage(req.file.buffer, req.file.mimetype);

    if (!analysis) {
      return res.status(500).json({
        error: "analysis_failed",
        message: "Failed to analyze image"
      });
    }

    return res.json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error("❌ [Image Analysis] Error:", error.message);
    return res.status(500).json({
      error: "analysis_failed",
      message: error.message || "Image analysis failed"
    });
  }
});
