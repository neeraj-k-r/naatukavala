# Naatukavala

A local marketplace that connects neighbourhood shops with buyers — browse the
marketplace, order from verified sellers, and let shop owners run their own
subdomain storefront (`shopslug.naatukavala.com`) with promotions, analytics
and delivery tracking.

**Stack**

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS, deployed on Vercel |
| Backend | Express + TypeScript (ESM) + Multer, deployed on Render |
| Database & auth | Supabase (Postgres, RLS, GoTrue) |
| Media | Cloudinary (images, promotion videos) |

---

## Repository layout

```
frontend/            Next.js app (src/app routes, src/components, src/lib)
backend/             Express API (src/routes, src/lib, src/middleware)
  supabase/          schema.sql + migrations/ (run manually in SQL editor)
  scripts/           create-superadmin.mjs
resume/              ATS resume template (job-search helper, unrelated to the app)
WORK_DONE.md         running log of what has been built and why
```

Run everything from the repo root — `concurrently` starts both apps.

---

## Features

- **Marketplace** — hero carousel, trending shelf, category filters, spotlight
  shops, live search; homepage loads in one `/marketplace/bootstrap` call
- **Shop storefronts** — private site per shop on a subdomain (with
  `/shop/<slug>` fallback on free hosts), shop-scoped search/sorting, share card
- **Selling** — shop signup, ID verification, product catalog with variants,
  product approval queue for unverified sellers, dashboard analytics
- **Promotions** — sponsored spotlight (Flipkart/Amazon style) with a promotion
  video, admin approve/reject with 7–90 day windows
- **Buying** — cart, coupons, checkout, orders, delivery tracking, returns,
  photo reviews with ✓ Helpful votes
- **Price-drop alerts** — wishlist remembers the saved price and alerts on drops
- **Admin console** — shops, products, promotions, bookings, coupons, reports,
  user roles, terms acceptances, alert inbox
- **Offline mode** — whole app swaps to an offline page on network loss,
  service worker (`public/sw.js`) caches the illustration up front
- **Uploads** — images ≤ 10 MB; videos ≤ 50 MB and **auto-compressed in the
  browser** (720p re-encode) when oversized, with progress shown in the form
- **Perf** — streaming pages with skeleton shells; measured ~167 ms warm
  homepage, ~83 ms shop page on a production build

---

## Getting started

Prerequisites: **Node 22+**, npm.

```bash
npm install                    # root
npm install --prefix backend
npm install --prefix frontend
```

### 1. Environment

Copy the template and fill it in:

```bash
cp .env.local.example frontend/.env.local   # frontend vars
cp .env.local.example backend/.env          # backend vars (only the API ones)
```

Key variables (full annotated list in `.env.local.example`):

| Where | Variable | Purpose |
| --- | --- | --- |
| frontend | `NEXT_PUBLIC_API_URL` | Backend base URL (`http://localhost:4000`) |
| frontend | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser auth |
| both | `NEXT_PUBLIC_APP_DOMAIN`, `NEXT_PUBLIC_COOKIE_DOMAIN` | Shared auth cookies across shop subdomains |
| backend | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Server DB access (**required** — the API refuses to start without them) |
| backend | `CLOUDINARY_*` | Media uploads |
| backend | `FRONTEND_URL` | CORS allowlist (comma-separated origins) |

`NEXT_PUBLIC_*` values are baked in at **build** time — set them before
deploying, not after.

### 2. Database

Schema lives in `backend/supabase/schema.sql`. Run it, then apply the
incremental files in `backend/supabase/migrations/` **in date order** through
the Supabase SQL editor (each is idempotent — safe to re-run):

```
20260918_auth_hardening.sql → 20260919_promotions.sql → 20260920_wishlist.sql
→ 20260921_price_drops.sql → 20260922_review_photos.sql → 20260923_review_votes.sql
→ 20260924_profile_email.sql → 20260925_admin_notifications.sql
→ 20260926_product_approval.sql → 20260926_pending_unverified_products.sql
→ 20260928_coupons.sql → 20260929_order_phone.sql → 20260930_product_variants.sql
→ 20261003_product_deletions.sql
```

### 3. Run

```bash
npm run dev                 # backend on :4000 + frontend on :3000
npm run seed:superadmin     # creates the admin account (uses SUPERADMIN_* vars)
```

Open http://localhost:3000.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Both apps with live reload |
| `npm run dev:backend` / `npm run dev:frontend` | One app only |
| `npm run build` | Production build of the frontend |
| `npm run lint` | ESLint (frontend) |
| `npm run seed:superadmin` | Seed the superadmin account |
| `npm run build --prefix backend` | Type-check/compile the API to `backend/dist` |

---

## Deployment

- **Frontend → Vercel**: import the repo with **Root Directory = `frontend`**
  so Vercel installs and builds only the Next.js app (the repo-root
  `vercel.json` covers root-level builds). Set the `NEXT_PUBLIC_*` vars in the
  project settings **before** the first build, then hard-refresh after deploys.
- **Backend → Render**: web service, build `npm run build`, start `npm start`
  (runs `backend/dist`). Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `CLOUDINARY_*` and `FRONTEND_URL` (your Vercel origin) in the dashboard.
- **Netlify**: kept as a fallback host — `netlify.toml` builds only the
  frontend (`base = frontend`).
- **Shop subdomains**: set `NEXT_PUBLIC_APP_DOMAIN` to the real domain and
  `NEXT_PUBLIC_COOKIE_DOMAIN` to `.yourdomain.com`; on free hosts
  (`.vercel.app`, `.netlify.app`) storefronts fall back to `/shop/<slug>` URLs.

---

## Project conventions

- Small, single-purpose commits (this repo deliberately keeps them granular).
- DB changes ship as a migration file **plus** the matching `schema.sql` update
  **plus** TypeScript type updates in `backend/src/lib/database.ts` and
  `frontend/src/lib/database.ts` (the types are hand-maintained in the
  generated style — regenerate with
  `npx supabase gen types typescript --project-id <ref>`).
- New backend features degrade gracefully when their migration has not been
  run yet: pages show setup hints instead of crashing.
- Client-only data (cart, terms acceptance, theme, online status) is read in
  `useEffect` — never during render, or SSR hydration mismatches appear.
- Checklists and progress history live in `WORK_DONE.md`; a job-search
  ATS resume template lives in `resume/ATS-Resume-Template.md`.

---

## Troubleshooting

- **Site won't load after pulling backend commits** — restart the backend;
  `tsx watch` can miss reloads and serve stale code.
- **Frontend crashes with Turbopack checksum errors** — free port 3000, delete
  `frontend/.next`, restart.
- **Upload returns 500/413** — check the limits (10 MB image, 50 MB video) and
  that Cloudinary credentials are set on the backend.
- **A shipped feature looks missing** — confirm its migration was run in the
  Supabase SQL editor.
