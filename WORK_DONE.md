# Naatukavala — Work Done So Far

**Repo:** `neeraj-k-r/naatukavala` · **Branch:** `master` · **102 commits**
**Stack:** Next.js 16 (frontend) + Express API (backend) + Supabase (Postgres/auth) + Cloudinary (images)
**Date:** September 2026

> How we work in this repo: every change lands as small, single-purpose commits
> (often 1–3 files each). Database changes ship as SQL files in
> `backend/supabase/migrations/` + matching updates to `schema.sql` + TypeScript
> types. New backend features degrade gracefully when their migration hasn't
> been run yet — pages show setup hints instead of crashing.

---

## 1. Auth & session reliability (the stale-username bug)

**Problem:** after logout → signup, the navbar kept showing the previous user's
name until a manual refresh.

- Navbar syncs the server-rendered account during render (no more stale `useState`)
- Sign-out clears the browser session *and* server cookies instantly
- Dashboard is `force-dynamic` — one seller's stats are never served to another
- Auth actions revalidate the root layout; Supabase session refreshes in `proxy.ts`
- API tokens validated via `getUser()` instead of trusting cookies

Commits: `6d23509`, `0e9aada`, `6ab18e1`, `154be46`

## 2. Security hardening

- Role-escalation blocked at the DB level: signup trigger whitelists
  `buyer`/`seller` only; a second trigger stops self-promotion via the anon key
- Backend authorizes from the `profiles` role, never client-writable metadata
- Rate-limited auth endpoints (20 tries / 10 min / IP), strict input caps,
  no PII in auth logs
- CORS restricted to known frontend origins (`FRONTEND_URL`)
- Admins can no longer demote or delete superadmin/admin accounts
- Uploads accept images only (JPEG/PNG/WEBP/GIF); temp files cleaned up
- JSON bodies capped at 100 KB; security headers on API and storefront

Commits: `eb78e11`, `941fa8a`, `6f43a35`, `06e5df5`, `bbb221f`, `cf366a1`,
`bbdcb7f`, `886cc70`, `bff828f`, `890faba`, `69b3496`

## 3. Promotions / sponsored spots (Flipkart-style)

- Sellers request promotion for their whole shop or one product (approved shops only)
- Admins approve with 7–90 day windows, reject, or end early
- Approved items get a **Sponsored** spotlight section + badges on the marketplace
- Review queue, seller request tracker, expiry handled by date (no cron)

Commits: `3d73dbb`, `68539e2`, `74e0153`, `3a08dff`, `ebba42e`, `7938f9a`, `1ec3fee`

## 4. Wishlist

- Heart on every product card + product page (optimistic UI, login redirect for guests)
- `/wishlist` page, navbar link with badge, toggle API, per-user RLS

Commits: `66082e3`, `c773fc0`, `6e1cf66`, `fd6922c`, `5e65821`, `bd7f28f`

## 5. Private shop websites (subdomain storefronts)

- Visiting `shopslug.naatukavala.com` shows **only that shop**: branded navbar/footer,
  no marketplace/sell/dashboard links, no exit link
- Dashboard → Shop profile has a **"Your website"** share card with copy button
- Storefronts have shop-scoped **search, category pills, and sorting**
  (shareable URLs, work on subdomains and `/shop/<slug>` fallback)

Commits: `721f6ed`, `ee97b64`, `cfa4ff4`, `a23a3d3`, `40f58d2`

## 6. Price-drop alerts

- Wishlist remembers the price at save-time; further drops alert exactly once each
- Navbar bell with unseen-drop count; wishlist **Price drops** section with
  old → new prices and `-X%` badges

Commits: `c45c2bc`, `e783521`, `85124c5`, `f66fd8b`

## 7. Performance (Amazon-level goal)

- Token validation memoized per request; wishlist fetches folded into parallel batches
- Proxy skips Supabase entirely when no session cookies exist
- Backend caches verified tokens 60 s; toggle does 2 queries instead of 3; no full
  page reload on heart taps
- Homepage collapsed from **5 backend calls to 1** (`/marketplace/bootstrap`)
  and streams with shimmer skeletons (hero paints instantly)
- Measured on a production build: **homepage 167 ms warm, shop page 83 ms,
  wishlist 57 ms** (dev mode stays ~1–2.5 s — normal for on-demand compile)

Commits: `2445b4f`, `6323197`, `f508977`, `7fc1e2a`, `8252217`

## 8. Photo reviews + helpful votes

- Buyers attach up to 4 photos to delivered-order feedback (editing keeps old ones)
- Thumbnails in every review list (product + shop pages)
- **✓ Helpful (n)** button per review — one vote per user, optimistic, persists

Commits: `6866f6e`, `bc0193c`, `250d395`, `90a2f80`, `4a64182`, `0f9a806`,
`d946a16`, `c1f6696`, `c9ce452`, `df460ac`, `a4acf5f`, `9440469`, `4319442`, `50d134a`

## 9. Email on profiles + user deletion behavior

- `profiles.email` column: backfilled from auth accounts, auto-filled on signup
- Deleting a user cascades shop + products **and** clears the catalog cache so
  they vanish instantly (previously lingered ~2 min)
- Self-delete blocked in the API; sellers with order history get a 409 pointing
  to shop suspension instead of a raw FK error; confirm dialog states the outcome

Commits: `ad1cb8b`, `dc865dc`, `e70fc22`, `b59271e`, `308e726`, `95e1b81`, `d14ccc1`

## 10. Unconfirmed-order auto-cancel + admin alerts

- `pending` orders auto-cancel 24 h after placement (lazy sweep on order reads —
  race-safe, restores stock, writes tracking history)
- One unread alert per offending shop: *"{Shop} is not accepting orders — N
  auto-cancelled in 30 days"*, with red overview banner + **Alerts** inbox page
- Sellers and buyers both see "auto-cancels {date}" warnings on pending orders

Commits: `49e35dc`, `16e84fd`, `b655464`, `6f9a65c`, `67c81de`, `6e9e62d`,
`f1c3fa6`, `9b0c1a2`, `59831f4`, `d0ffb84`, `264eb66`

## 11. Self account deletion + signup image fix

- Account page **Danger zone**: password-confirmed self-delete (rate-limited),
  blocked with guidance when shop order history exists
- Shop logo/banner upload moved off signup (uploads need a login) to the
  dashboard; logged-out uploads now say so instead of "Missing authorization header"

Commits: `289de76`, `3d1a35c`, `884a67c`, `1b83c95`, `6893b9e`, `5e681ba`

## 12. Product approval for unverified sellers (current)

- Rule is based on **ID-card verification**, not shop approval: unverified
  sellers queue **every** new/edited product for review; verified sellers go live instantly
- Pending items are invisible everywhere (marketplace, search, categories,
  spotlight, shop page, direct URL); sellers see "In review" states
- Admin **Products** queue + overview count; existing products of unverified
  shops were backfilled to `pending`
- Live case: MURINGAKOL (shop approved, ID rejected) is hidden until its
  product is approved in the queue

Commits: `6d11cc0`, `1094b05`, `41025d9`, `8dcbd52`, `dcd573c`, `0ab1138`,
`a9eaf5a`, `b0e7bb7`, `febf1d5`, `15b8bbd`

*(Earlier history — splits, verification badges, returns, analytics, reviews,
tracking, caching: `e75632b` … `0ced425`. Admin sales report/bookings
`2765581` was built alongside.)*

---

## Pending manual steps (Supabase SQL editor, in order)

1. `20260918_auth_hardening.sql` — role-escalation fix
2. `20260919_promotions.sql` — sponsored spots
3. `20260920_wishlist.sql` — wishlist
4. `20260921_price_drops.sql` — alert baselines
5. `20260922_review_photos.sql` — review images
6. `20260923_review_votes.sql` — helpful votes
7. `20260924_profile_email.sql` — profile emails
8. `20260925_admin_notifications.sql` — auto-cancel alerts inbox
9. `20260926_product_approval.sql` — product review queue
10. `20260926_pending_unverified_products.sql` — queue old unverified products

Also set `FRONTEND_URL` in the production backend env (CORS allowlist).

## Ops notes (learned the hard way)

- Background dev servers die silently between sessions — if the site won't load,
  restart them (`npm run dev` from repo root, or backend/frontend separately).
- After pulling backend commits, **restart the backend** — `tsx watch` misses
  reloads on this filesystem and will serve stale code (this once made a shipped
  feature look broken).
- If the frontend dies with Turbopack panics / checksum errors: kill the process
  on port 3000, delete `frontend/.next`, restart.
- The `F:` drive drops occasionally; wait for it to reconnect before working.
- Only pre-existing uncommitted change: `backend/src/lib/cache.ts` TTL tweak.
