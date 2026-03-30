# FalStudio Cloud

Persistent AI Generation Workspace with R2 Storage.

Generate stunning images and videos using Fal.ai models. All assets are automatically saved to your private Cloudflare R2 bucket with full lineage tracking.

## Features

- **Text-to-Image**: Flux 1.0 Pro, Flux 1.0 Dev, SDXL
- **Image-to-Video**: Stable Video Diffusion (SVD)
- **Persistent Storage**: Auto-upload to Cloudflare R2
- **Workflow Chaining**: Use any image as input for video generation
- **Asset Library**: Searchable, filterable gallery with lineage tracking
- **Secure Credentials**: AES-256 encrypted API keys

## Tech Stack

- Next.js 16 (App Router)
- Prisma 5 + PostgreSQL
- Clerk Authentication
- Cloudflare R2 (S3-compatible)
- Fal.ai Async API

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env` and fill in your values:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/falstudio"

# Clerk (https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Encryption key for credentials (generate with: openssl rand -hex 32)
ENCRYPTION_KEY="your-64-char-hex-key"

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `ENCRYPTION_KEY` | 64-char hex key for AES-256 encryption |
| `FAL_WEBHOOK_SECRET` | Secret for validating Fal.ai webhook signatures |
| `NEXT_PUBLIC_APP_URL` | Public URL for webhook callbacks |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | Submit a generation job |
| GET | `/api/jobs` | List jobs with pagination/filtering |
| GET | `/api/jobs/[jobId]` | Get job status |
| GET | `/api/assets?jobId=X` | Get presigned R2 URL for asset |
| GET/POST | `/api/settings` | Get/update credentials |
| POST | `/api/webhooks/fal` | Fal.ai webhook handler |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/        # Protected routes
│   │   ├── gallery/       # Asset gallery
│   │   ├── generate/      # Generation landing
│   │   └── settings/     # Credential management
│   ├── api/              # API routes
│   │   ├── generate/     # Job submission
│   │   ├── jobs/        # Job listing/status
│   │   ├── assets/       # R2 presigned URLs
│   │   ├── settings/     # Credentials
│   │   └── webhooks/fal/ # Fal.ai callbacks
│   └── theme.css         # Mission Control theme
├── components/
│   ├── ui/icons.tsx      # SVG icons
│   ├── AssetCard.tsx     # Gallery item card
│   ├── GalleryGrid.tsx   # Gallery with filters
│   ├── GenerationModal.tsx
│   └── layout/DashboardLayout.tsx
└── lib/
    ├── prisma.ts         # Database client
    ├── auth.ts           # Auth helpers
    ├── encryption.ts      # AES-256 encryption
    ├── fal.ts            # Fal.ai API
    ├── r2.ts             # R2 storage
    └── fal-client.ts     # Client-side Fal models
```

## License

MIT
