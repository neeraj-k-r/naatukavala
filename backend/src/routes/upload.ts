import type { Router } from "express";
import express from "express";
import multer from "multer";
import { mkdirSync } from "fs";
import { unlink } from "fs/promises";
import { join } from "path";

import { requireAuth } from "../middleware/auth.js";
import cloudinary from "../lib/cloudinary.js";

const router: Router = express.Router();

function ensureUploadDir(): string {
  const dir = join(process.cwd(), "uploads");
  mkdirSync(dir, { recursive: true });
  return dir;
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  // Fresh deploys have no uploads/ dir (gitignored) — multer throws ENOENT
  // without it, so ensure it exists (temp files only; images go to Cloudinary).
  dest: ensureUploadDir(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, done) => {
    // Images only — never let authenticated users host executables or
    // scripts under the project's Cloudinary account.
    if (ALLOWED_MIME.has(file.mimetype)) done(null, true);
    else done(new Error("Only JPEG, PNG, WEBP or GIF images are allowed."));
  },
});

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "naatukavala",
      resource_type: "image",
    });
    return res.status(201).json({ url: result.secure_url });
  } catch {
    return res.status(500).json({ error: "Upload failed. Please try again." });
  } finally {
    // Multer leaves the temp file behind — remove it so uploads/ can't
    // fill the disk over time.
    await unlink(req.file.path).catch(() => {});
  }
});

export default router;