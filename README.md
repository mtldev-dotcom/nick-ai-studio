# FalStudio - AI Generation Workspace

A production-ready frontend UI for [Fal.ai](https://fal.ai) that enables AI-powered image and video generation with persistent storage via Cloudflare R2.

## Features

- **20+ AI Models** - Flux, Recraft, Ideogram, Stable Diffusion, Kling, Luma, and more
- **Persistent Storage** - All generated assets saved to your private Cloudflare R2 bucket
- **Image-to-Video** - Transform images into videos using Stable Video Diffusion
- **Secure Credentials** - AES-256-GCM encryption for API keys
- **Real-time Updates** - Webhook-based job status notifications
- **Modern UI** - Dark theme with smooth animations via Framer Motion

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.1 (App Router) |
| UI | React 19, Tailwind CSS v4, Framer Motion |
| Auth | next-auth v5 (credentials provider) |
| Database | PostgreSQL via Prisma |
| Storage | Cloudflare R2 via AWS S3 SDK |
| Queue | Fal.ai Queue API with webhooks |
| Validation | Zod |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Cloudflare R2 bucket
- Fal.ai API key

### Installation

```bash
# Clone the repository
git clone https://github.com/mtldev-dotcom/nick-ai-studio.git
cd nick-ai-studio

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

### Environment Variables

```env
# Auth
AUTH_SECRET="your-secret-key"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nickstudio"

# Encryption (openssl rand -hex 32)
ENCRYPTION_KEY="your-64-char-hex-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Fal Webhook Secret (optional)
FAL_WEBHOOK_SECRET="your-webhook-secret"
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐ │
│  │ Gallery │  │ Generate │  │ Settings│  │  Sign In │ │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └────┬─────┘ │
└───────┼────────────┼────────────┼────────────┼─────────┘
        │            │            │            │
┌───────┴────────────┴────────────┴────────────┴─────────┐
│                    Next.js API Routes                    │
│  /api/jobs  /api/generate  /api/settings  /api/assets  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│                      Fal.ai Queue API                    │
│         Submit → Webhook → Download → R2 Upload         │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────┐
│                    Cloudflare R2 Storage                 │
│              Persistent asset storage (S3 API)          │
└─────────────────────────────────────────────────────────┘
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/jobs` | GET | List user's jobs with pagination |
| `/api/jobs/[jobId]` | GET | Get job details |
| `/api/jobs/[jobId]` | DELETE | Delete a job |
| `/api/generate` | POST | Submit new generation job |
| `/api/assets` | GET | Get presigned URL for asset |
| `/api/settings` | GET | Get user credentials (masked) |
| `/api/settings` | POST | Save/update credentials |
| `/api/webhooks/fal` | POST | Fal.ai webhook handler |
| `/api/health` | GET | Health check endpoint |

## Supported Models

### Image Models
- **Flux 1.1 Pro** - Latest Flux with improved quality
- **Flux 1.0 Pro/Dev/Schnell** - Various Flux variants
- **Flux Realism** - Photorealistic generation
- **Recraft v3** - Style-controlled generation
- **Ideogram v2** - Excellent text rendering
- **Stable Diffusion 3.5/3/XL** - SD family models
- **PixArt Alpha** - Efficient transformer model
- **AuraFlow** - Open-source flow-based model

### Video Models
- **Kling v2 Standard/Pro** - High-quality video generation
- **Luma Dream Machine** - Cinematic video
- **MiniMax Video** - Fast video generation
- **Stable Video Diffusion** - Image-to-video
- **Fast AnimateDiff** - Quick animations
- **Hailuo Video** - Realistic video

### Upscale Models
- **ESRGAN** - AI-powered upscaling
- **Real-ESRGAN** - Real-world super-resolution

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())
  
  credentials Credentials?
  jobs        Job[]
}

model Credentials {
  id             String   @id @default(uuid())
  userId         String   @unique
  falApiKeyEnc   String?
  r2AccessKeyEnc String?
  r2SecretKeyEnc String?
  r2Endpoint     String?
  r2BucketName   String?
  
  user User @relation(fields: [userId], references: [id])
}

model Job {
  id           String    @id @default(uuid())
  userId       String
  status       JobStatus @default(PENDING)
  type         AssetType
  model        String
  prompt       String
  negativePrompt String?
  seed         Int?
  params       Json?
  falRequestId String?
  r2Key        String?
  fallbackUrl  String?
  errorMessage String?
  parentId     String?
  createdAt    DateTime  @default(now())
  completedAt  DateTime?
}
```

## Security

- All API keys encrypted with AES-256-GCM before storage
- Webhook signature validation using HMAC-SHA256
- Input validation with Zod on all API routes
- Session-based authentication via next-auth
- Credentials never exposed to client-side

## License

Private - All rights reserved.