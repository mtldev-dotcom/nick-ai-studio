# CLAUDE.md - Development Guidelines

## Project Overview

FalStudio is a Next.js 16.2.1 application — a self-hosted frontend UI for [Fal.ai](https://fal.ai)'s AI generation platform. It supports 80+ models across images, video, audio, upscaling, and editing. Built with App Router, React 19, Prisma (PostgreSQL), and Cloudflare R2 for persistent storage.

## Key Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Database
npx prisma migrate deploy    # Run migrations (production)
npx prisma db push           # Sync schema without migration file (dev)
npx prisma generate          # Regenerate Prisma client
npx prisma studio            # Browse database

# Linting
npm run lint         # Run ESLint
```

## Architecture

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── assets/        # Presigned URL + file upload
│   │   ├── auth/          # NextAuth handlers
│   │   ├── generate/      # Job submission
│   │   ├── health/        # Health check
│   │   ├── jobs/          # Job CRUD + list
│   │   ├── settings/      # User credentials
│   │   └── webhooks/      # Fal.ai webhook
│   ├── (dashboard)/       # Protected layout group
│   │   ├── gallery/       # Asset gallery + loading skeleton
│   │   ├── generate/      # GenerationStudio page
│   │   └── settings/      # API key management
│   └── sign-in/           # Auth page
├── components/
│   ├── generation/        # Generation feature components
│   │   ├── GenerationStudio.tsx  # Main full-page generation UI
│   │   ├── DynamicParamForm.tsx  # Renders model param array as form
│   │   └── AssetPicker.tsx       # Upload or pick from gallery
│   ├── layout/
│   │   ├── DashboardLayout.tsx   # Header + mobile layout wrapper
│   │   └── BottomNav.tsx         # Mobile bottom tab bar
│   └── ui/
│       ├── icons.tsx      # SVG icon exports
│       ├── Toast.tsx      # Toast component + ToastProvider
│       ├── Slider.tsx     # Range slider
│       ├── Toggle.tsx     # Boolean switch
│       └── SizePicker.tsx # Image size / aspect ratio picker
└── lib/
    ├── auth.ts            # NextAuth config
    ├── encryption.ts      # AES-256-GCM encrypt/decrypt
    ├── fal.ts             # Fal.ai SDK — submitFalJob, getFalJobStatus, etc.
    ├── fal-client.ts      # Client-safe re-exports from models
    ├── models.ts          # Model catalog (80+ models, typed ModelParam[])
    ├── prisma.ts          # Prisma client singleton
    ├── r2.ts              # Cloudflare R2 helpers
    ├── toast.ts           # useToast() hook + ToastContext
    └── validations.ts     # Zod schemas
```

### Model System

Every model in `src/lib/models.ts` has a typed `params: ModelParam[]` array that drives `DynamicParamForm`. There is no hardcoded form — the form renders itself based on param types:

```typescript
type ParamType =
  | "textarea"      // prompt, negative_prompt
  | "text"          // single-line text
  | "number"        // seed (manual input)
  | "slider"        // guidance_scale, steps, duration, etc.
  | "select"        // output_format, style, voice
  | "toggle"        // enable_safety_checker, enable_prompt_expansion
  | "image-upload"  // single image (image_url, first_frame_image)
  | "images-upload" // multi image (image_urls)
  | "size-picker"   // image_size with visual presets
  | "aspect-ratio"; // aspect_ratio with pill buttons
```

**Model types (ModelType):**
`TEXT_TO_IMAGE | IMAGE_TO_IMAGE | TEXT_TO_VIDEO | IMAGE_TO_VIDEO | UPSCALE | IMAGE_EDIT | AUDIO | MUSIC`

To derive the DB-compatible asset type: `getAssetType(model.modelType)` → `"IMAGE" | "VIDEO" | "AUDIO"`.
Note: AUDIO maps to IMAGE in DB (Prisma `AssetType` enum only has IMAGE/VIDEO).

### Data Flow

1. **Generation Request**
   - User configures params in `GenerationStudio` → `DynamicParamForm`
   - POST `/api/generate` with `{ model, prompt, negativePrompt, seed, params: { ...snakeCaseRest } }`
   - All extra params are flat snake_case (e.g. `guidance_scale`, `aspect_ratio`, `first_frame_image`)
   - Server merges `model.defaultParams` ← `userParams` and submits to Fal.ai queue
   - Returns `{ jobId }` immediately

2. **Webhook Processing**
   - Fal.ai POSTs to `/api/webhooks/fal`
   - Validates HMAC-SHA256 signature
   - Downloads output, uploads to R2
   - Updates Job status → COMPLETE (or UPLOAD_FAILED)

3. **Asset Display**
   - Gallery fetches jobs from `/api/jobs`
   - Completed jobs fetch presigned R2 URL from `/api/assets?jobId=...`
   - "Use as Input" on an image → `/generate?inputImage=<jobId>`
   - GenerationStudio resolves jobId to presigned URL and injects into first image-upload param

### Mobile Navigation

- Desktop (≥ md): top header nav (Gallery, Generate, Settings)
- Mobile (< md): `BottomNav` — 3-tab bar pinned to bottom with `safe-area-inset-bottom`
- Page body needs `pb-20 md:pb-0` to clear the bottom nav (already in DashboardLayout)

## Code Conventions

### TypeScript
- Strict mode, avoid `any` (prefer `unknown` + narrowing)
- `interface` for object shapes, `type` for unions
- `async/await` throughout, try/catch on all API calls

### React
- `"use client"` on all interactive components
- Local `useState` for page state — no global store
- `useToast()` from `@/lib/toast` for all notifications — no ad-hoc toast state

### API Routes
- Auth check first: `const session = await auth()` → 401 if null
- Zod validation on all inputs → 400 on failure
- Error shape: `{ error: "message" }`
- Webhooks always return 200 (Fal.ai retries on non-200)

### Styling
- Tailwind CSS v4 — no config file, `@import "tailwindcss"` in globals.css
- Theme vars in `src/app/theme.css`
- Mission Control dark theme: `#080808` bg, `#d8eaf5` headings, `#b8cfdf` body, `#8898a5` muted
- Accents: teal `#00e5c9`, blue `#4a9eff`, purple `#b06aff`, amber `#ffbe3c`, coral `#ff5240`
- Card classes: `.mc-card`, `.mc-card-teal`, `.mc-card-blue`, `.mc-card-purple`, etc.
- **Mobile-first**: base styles for mobile, `md:` prefix for desktop

## Environment Variables

Required in `.env`:
```env
AUTH_SECRET              # NextAuth secret (openssl rand -base64 32)
DATABASE_URL             # PostgreSQL connection string
ENCRYPTION_KEY           # 64-char hex for AES-256 (openssl rand -hex 32)
NEXT_PUBLIC_APP_URL      # Public app URL — must be reachable by Fal.ai for webhooks
FAL_WEBHOOK_SECRET       # Optional but strongly recommended in production
```

## Database

PostgreSQL via Prisma 5. Key models:
- `User` — email-only, auto-created on first sign-in
- `Credentials` — encrypted Fal.ai key + R2 config (one per user)
- `Job` — generation jobs with status tracking

Job statuses: `PENDING → PROCESSING → COMPLETE | UPLOAD_FAILED | FAL_FAILED | CANCELLED`

No migrations dir yet — use `npx prisma db push` for first run, then `npx prisma migrate dev` for tracked changes.

## Security

- API keys encrypted at rest: AES-256-GCM with scrypt key derivation
- Webhook signatures: HMAC-SHA256 with `crypto.timingSafeEqual`
- HTTP security headers on all routes: CSP, HSTS, X-Frame-Options, Permissions-Policy, X-Content-Type-Options, Referrer-Policy
- Auth enforced at routing layer via `src/proxy.ts` (Next.js 16 proxy, replaces deprecated middleware.ts)
- All API routes require auth session except `/api/health` and `/api/webhooks/fal`

## Common Issues

### "Fal.ai API key not configured"
Go to Settings and save your Fal.ai API key. It's validated against the live API before saving.

### Webhook not firing
`NEXT_PUBLIC_APP_URL` must be a publicly reachable URL. Use ngrok or Cloudflare Tunnel for local dev. Also verify `FAL_WEBHOOK_SECRET` matches.

### Gallery images go blank after ~1 hour
R2 presigned URLs expire after 1 hour. Refresh the page to get new ones.

### Audio/Music jobs show in gallery as images
Expected behavior — `AssetType` in Prisma only has IMAGE/VIDEO. Audio assets are stored as IMAGE type.

### Build error: "Unknown model: fal-ai/..."
The model ID in a job doesn't match any entry in `src/lib/models.ts`. Add it to the catalog or the job was created with an old model ID.
