# ⚡ FalStudio — ADHD.md
> *Last updated: 2026-04-01*

---

## 🧠 What Is This?
A self-hosted frontend workspace for Fal.ai — generate images, videos, audio, and more using 80+ models, with everything saved to your own Cloudflare R2 bucket.

---

## ✅ What It Does (Right Now)
- 80+ Fal.ai models across 8 types: Text→Image, Image→Image, Text→Video, Image→Video, Upscale, Edit, Audio, Music
- Dynamic form rendering — every model gets the right controls (sliders, aspect ratio pickers, toggles, image inputs)
- Asset picker: pick images from your gallery OR upload new ones as model inputs
- Mobile-first: bottom nav bar on mobile, full responsive layout
- Centralized toast notifications across all pages
- Gallery with search, filter by type, "Use as Input" on any image → jumps to Generate with it pre-loaded
- Long-press context menu on gallery cards (mobile)
- All assets auto-saved to your private R2 bucket
- AES-256-GCM encryption for all stored API keys
- Webhook-based job completion (no client-side long polling in prod)
- HTTP security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)

---

## 🚀 What It Will Do
- [ ] Real-time job progress via SSE (queue position, logs)
- [ ] Per-user rate limiting
- [ ] Batch generation (submit N jobs at once)
- [ ] LoRA model selection for Flux Dev
- [ ] Job retry on UPLOAD_FAILED
- [ ] R2 storage usage dashboard / cleanup tool
- [ ] Fal.ai model discovery from API (browse live catalog)
- [ ] Audio/Music playback in gallery

---

## 🎯 What We Want
> A dead-simple, beautiful UI to use all of Fal.ai from one place — not locked to any specific model, mobile-friendly, with your own permanent storage. Think of it as a personal AI studio where nothing expires and you own your assets.

---

## 🏗️ How It's Built
| Layer | Tech |
|-------|------|
| Framework | Next.js 16.2.1 (App Router, Turbopack) |
| UI | React 19, Tailwind v4, Framer Motion |
| Auth | next-auth v5 beta (email-only credentials) |
| Database | PostgreSQL via Prisma 5 |
| Storage | Cloudflare R2 (AWS S3 SDK v3) |
| AI | @fal-ai/client v1.9.5 (Queue API + webhooks) |
| Validation | Zod v4 |
| Crypto | Node.js AES-256-GCM (built-in) |

---

## 🔧 Systems & Infra
- **Port:** `localhost:3000` (`npm run dev`)
- **DB:** PostgreSQL — `npx prisma studio` to browse
- **Env:** `.env` — key vars: `DATABASE_URL`, `ENCRYPTION_KEY`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `FAL_WEBHOOK_SECRET`
- **Proxy:** `src/proxy.ts` (Next.js 16 replacement for middleware.ts)

---

## 💻 Code Patterns
- **Models:** `src/lib/models.ts` — each model has `params: ModelParam[]` with typed fields that drive `DynamicParamForm`
- **Generation flow:** GenerationStudio → `/api/generate` → Fal.ai queue → webhook → R2 upload → Job COMPLETE
- **Asset reuse:** Gallery "Use as Input" → `/generate?inputImage=<jobId>` → AssetPicker resolves presigned URL
- **Toasts:** `useToast()` from `@/lib/toast` — wrap in `<ToastProvider>` (done in layout.tsx)
- **Fal params:** All snake_case, passed flat. `model.defaultParams` ← user params (merge in fal.ts)
- **Job type:** Derived via `getAssetType(model.modelType)` → IMAGE | VIDEO (AUDIO maps to IMAGE in DB for now)

---

## 🔌 APIs & Integrations
| Service | What For | Env Key |
|---------|----------|---------|
| Fal.ai | AI model queue + webhooks | User-provided (stored encrypted) |
| Cloudflare R2 | Permanent asset storage | User-provided (stored encrypted) |
| PostgreSQL | Jobs, users, credentials | `DATABASE_URL` |

---

## ⚠️ Watch Out
- `next-auth` is **v5 beta** — no password auth, anyone with an email can sign in (email-only credentials, auto-creates user)
- `ENCRYPTION_KEY` changing breaks all stored credentials — no key rotation strategy yet
- Webhook requires public URL — localhost needs ngrok/tunnel for testing
- `FAL_WEBHOOK_SECRET` is optional but strongly recommended in prod
- R2 presigned URLs expire in 1 hour — gallery images may show broken after that (need to re-fetch)
- `/api/jobs` `type` filter still uses `IMAGE | VIDEO` (Prisma enum) — audio models stored as IMAGE
- No migrations dir yet — first deploy needs `npx prisma db push` or `prisma migrate dev`

---

## 🗒️ Nick's Notes
> **2026-04-01** — Big production overhaul done. 24 models → 80+. Modal generation → full-page GenerationStudio. Mobile nav fixed (was completely hidden). Dynamic form replaces hardcoded prompt/seed form. Asset reuse from gallery added. Security headers added. Toast centralized. middleware.ts → proxy.ts (Next.js 16). Build clean ✅
