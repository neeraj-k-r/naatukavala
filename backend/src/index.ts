import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import shopRoutes from "./routes/shops.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";
import promotionRoutes from "./routes/promotions.js";
import wishlistRoutes from "./routes/wishlist.js";
import marketplaceRoutes from "./routes/marketplace.js";
import reviewsRoutes from "./routes/reviews.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Reflecting any origin together with credentials lets arbitrary sites make
// authenticated requests. Restrict to the known frontend origin(s) instead.
const allowedOrigins = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (allowedOrigins.length === 0) {
  allowedOrigins.push("http://localhost:3000", "http://127.0.0.1:3000");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / server-to-server calls send no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed by CORS."));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/shops", shopRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/admin", adminRoutes);
app.use("/upload", uploadRoutes);
app.use("/promotions", promotionRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/marketplace", marketplaceRoutes);
app.use("/reviews", reviewsRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
