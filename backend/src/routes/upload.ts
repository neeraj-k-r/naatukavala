import type { Router } from "express";
import express from "express";
import multer from "multer";

import { requireAuth } from "../middleware/auth.js";
import cloudinary, { UPLOAD_PRESET } from "../lib/cloudinary.js";

const router: Router = express.Router();
const upload = multer({ dest: "uploads/", limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "naatukavala",
      upload_preset: UPLOAD_PRESET,
    });
    return res.status(201).json({ url: result.secure_url });
  } catch {
    return res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

export default router;