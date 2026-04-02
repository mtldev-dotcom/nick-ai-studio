# FalStudio — AI Generation Workspace

A self-hosted frontend for [Fal.ai](https://fal.ai) — generate images, videos, audio, and more using 80+ models, with everything saved permanently to your own Cloudflare R2 bucket.

## Features

- **80+ AI Models** — Text→Image, Image→Image, Text→Video, Image→Video, Upscale, Edit, Audio, Music
- **Dynamic Forms** — Every model gets the right controls: sliders, aspect ratio pickers, toggles, image inputs
- **Asset Reuse** — Pick any previously generated image as input for a new generation
- **Mobile-First** — Bottom navigation, touch-friendly, safe-area aware
- **Persistent Storage** — All assets saved to your private Cloudflare R2 bucket
- **Secure Credentials** — AES-256-GCM encryption for all stored API keys
- **Webhook Driven** — Fal.ai pushes completion events; no long-polling in production
- **Security Headers** — CSP, HSTS, X-Frame-Options, Permissions-Policy on all routes

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.1 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4, Framer Motion |
| Auth | next-auth v5 (credentials provider) |
| Database | PostgreSQL via Prisma 5 |
| Storage | Cloudflare R2 (AWS S3 SDK v3) |
| AI | @fal-ai/client v1.9.5 (Queue API + webhooks) |
| Validation | Zod v4 |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Cloudflare R2 bucket + API credentials
- Fal.ai API key ([fal.ai/dashboard](https://fal.ai/dashboard))

### Setup

```bash
git clone https://github.com/mtldev-dotcom/nick-ai-studio.git
cd nick-ai-studio
npm install

# Configure environment
cp .env.example .env
# Edit .env — see Environment Variables below

# Set up database
npx prisma db push      # first run (no migration history)
# or
npx prisma migrate deploy  # subsequent deploys

# Start development server
npm run dev
```

Then open `http://localhost:3000`, sign in with any email, and go to **Settings** to enter your Fal.ai and R2 credentials.

### Environment Variables

```env
# NextAuth
AUTH_SECRET="..."              # openssl rand -base64 32

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/falstudio"

# Encryption key for stored credentials
ENCRYPTION_KEY="..."           # openssl rand -hex 32  (64 hex chars)

# Public app URL — must be reachable by Fal.ai for webhooks
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Webhook secret (strongly recommended in production)
FAL_WEBHOOK_SECRET="..."
```

> **Webhook note:** For local development, use [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) so Fal.ai can reach your webhook endpoint.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (React 19)                  │
│                                                         │
│  Gallery ─── GenerationStudio ─── Settings              │
│    ↑               │                                    │
│    └── useToast()  │  DynamicParamForm                  │
│                    │  AssetPicker (Upload / Gallery)     │
└───────────────────-│────────────────────────────────────┘
                     │ fetch()
┌────────────────────▼────────────────────────────────────┐
│                 Next.js API Routes                       │
│  /api/generate  /api/jobs  /api/assets  /api/settings   │
│  /api/webhooks/fal  /api/health                         │
└───────────┬─────────────────────────────┬───────────────┘
            │ Queue submit                │ Result + upload
┌───────────▼──────────┐    ┌────────────▼───────────────┐
│    Fal.ai Queue API  │    │    Cloudflare R2 Storage    │
│  Submit → Webhook →  │    │  Permanent asset storage   │
│  → your /api/webhooks│    │  Presigned URLs (1hr TTL)  │
└──────────────────────┘    └────────────────────────────┘
            │
┌───────────▼──────────┐
│      PostgreSQL       │
│  Users, Credentials, │
│  Jobs (status track) │
└──────────────────────┘
```

### Generation Flow

1. User picks a model and fills in the dynamic form
2. POST `/api/generate` → creates a `Job` in DB, submits to Fal.ai queue
3. Fal.ai processes the job asynchronously
4. Fal.ai POSTs to `/api/webhooks/fal` on completion
5. Webhook downloads the output, uploads to R2, marks job COMPLETE
6. Gallery shows the asset via a fresh presigned R2 URL

### Asset Reuse

Any completed image in the gallery has a **"Use as Input"** button → navigates to `/generate?inputImage=<jobId>`. GenerationStudio auto-resolves the job to a presigned R2 URL and pre-fills it into the model's image input field.

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/jobs` | GET | ✓ | List jobs — supports `cursor`, `limit`, `type`, `status`, `search`, `model` |
| `/api/jobs/[jobId]` | GET | ✓ | Job details (polls Fal.ai status on localhost) |
| `/api/jobs/[jobId]` | PATCH | ✓ | Cancel job (`{ action: "cancel" }`) |
| `/api/jobs/[jobId]` | DELETE | ✓ | Delete job |
| `/api/generate` | POST | ✓ | Submit generation job |
| `/api/assets` | GET | ✓ | Presigned R2 URL for a job's asset |
| `/api/assets/upload` | POST | ✓ | Upload file to R2, returns presigned URL |
| `/api/settings` | GET | ✓ | Get credentials (masked) |
| `/api/settings` | POST | ✓ | Save/update credentials |
| `/api/webhooks/fal` | POST | — | Fal.ai webhook (HMAC-SHA256 validated) |
| `/api/health` | GET | — | Server + DB health check |

## Supported Models

### Text → Image (15+)
Flux 1.1 Pro · Flux 1.1 Pro Ultra · Flux 1.0 Pro/Dev/Schnell · Flux Realism · Flux Dev LoRA · Hyper SDXL · Recraft v3 · Ideogram v2/Turbo · SD 3.5 Large · SD 3 Medium · SDXL · Fast SDXL · Kolors · PixArt Sigma · AuraFlow · Sana

### Image → Image / Edit (7+)
Flux Kontext · Flux ControlNet · Flux Fill (Inpaint) · IP-Adapter Face ID · SD3 Img2Img · SDXL Img2Img · Flux 2 Pro Edit

### Text → Video (9+)
Kling v2 Standard/Pro · Luma Ray 2 · Luma Dream Machine · MiniMax Video 01 · Hailuo Video 02 · Wan 2.1 T2V · CogVideoX 5B · AnimateDiff Turbo

### Image → Video (7+)
Kling v2 I2V Standard/Pro · Stable Video Diffusion · Wan 2.1 I2V · LTX Video · Luma I2V · Hailuo I2V

### Upscale (5)
AuraSR · Clarity Upscaler · ESRGAN · Real-ESRGAN · CCSR

### Image Tools / Edit (4)
Remove Background (Bria) · Face to Sticker · Face Restore (GFPGAN) · Remove BG (rembg)

### Audio / TTS (3)
Kokoro TTS (English) · PlayHT TTS v3 · F5 TTS (voice cloning)

### Music (2)
Stable Audio · MusicGen

## Database Schema

```prisma
model User {
  id          String        @id @default(uuid())
  email       String        @unique
  createdAt   DateTime      @default(now())
  credentials Credentials?
  jobs        Job[]
}

model Credentials {
  id             String   @id @default(uuid())
  userId         String   @unique
  falApiKeyEnc   String?  // AES-256-GCM encrypted
  r2AccessKeyEnc String?
  r2SecretKeyEnc String?
  r2Endpoint     String?
  r2BucketName   String?
  updatedAt      DateTime @updatedAt
  user           User     @relation(...)
}

model Job {
  id             String    @id @default(uuid())
  userId         String
  status         JobStatus @default(PENDING)
  type           AssetType             // IMAGE | VIDEO
  model          String                // Fal.ai model endpoint ID
  prompt         String
  negativePrompt String?
  seed           Int?
  params         Json?                 // extra model-specific params
  falRequestId   String?
  r2Key          String?
  fallbackUrl    String?
  errorMessage   String?
  parentId       String?               // for lineage tracking
  createdAt      DateTime @default(now())
  completedAt    DateTime?

  @@index([userId, createdAt(sort: Desc)])
  @@index([falRequestId])
}

enum JobStatus { PENDING PROCESSING COMPLETE UPLOAD_FAILED FAL_FAILED CANCELLED }
enum AssetType { IMAGE VIDEO }
```

## Development

```bash
npm run dev       # dev server with Turbopack
npm run build     # production build (type-checks first)
npm run lint      # ESLint
npx prisma studio # database browser at localhost:5555
```

## Security

- API keys encrypted at rest with AES-256-GCM (scrypt key derivation)
- Webhook signatures validated with HMAC-SHA256 and timing-safe comparison
- HTTP security headers on all routes (CSP, HSTS, X-Frame-Options, Permissions-Policy)
- Authentication enforced at routing layer via `src/proxy.ts`
- Zod validation on all API inputs

## License

Private — All rights reserved.
