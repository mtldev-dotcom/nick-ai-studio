# CLAUDE.md - Development Guidelines

## Project Overview

FalStudio is a Next.js 16.2.1 application that provides a frontend UI for Fal.ai's AI generation platform. It uses the App Router, React 19, Prisma, and Cloudflare R2 for persistent storage.

## Key Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Database
npx prisma migrate deploy    # Run migrations
npx prisma generate          # Generate Prisma client
npx prisma studio            # Open Prisma Studio

# Linting
npm run lint         # Run ESLint
```

## Architecture

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── assets/        # Asset presigned URLs
│   │   ├── auth/          # NextAuth handlers
│   │   ├── generate/      # Job submission
│   │   ├── health/        # Health check
│   │   ├── jobs/          # Job CRUD
│   │   ├── settings/      # User credentials
│   │   └── webhooks/      # Fal.ai webhooks
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── gallery/       # Asset gallery
│   │   ├── generate/      # Generation page
│   │   └── settings/      # Settings page
│   └── sign-in/           # Auth pages
├── components/            # React components
│   ├── layout/           # Layout components
│   └── ui/               # UI primitives (icons)
└── lib/                  # Shared utilities
    ├── auth.ts           # NextAuth config
    ├── encryption.ts     # AES-256-GCM encryption
    ├── fal.ts            # Fal.ai SDK client
    ├── fal-client.ts     # Client-side model config
    ├── models.ts         # Model catalog
    ├── prisma.ts         # Prisma client
    ├── r2.ts             # Cloudflare R2 client
    └── validations.ts    # Zod schemas
```

### Data Flow

1. **Generation Request**
   - Client submits to `/api/generate`
   - Server validates input with Zod
   - Creates Job in database
   - Submits to Fal.ai Queue API
   - Returns jobId to client

2. **Webhook Processing**
   - Fal.ai sends POST to `/api/webhooks/fal`
   - Server validates signature
   - Downloads asset from Fal.ai temp URL
   - Uploads to user's R2 bucket
   - Updates Job status to COMPLETE

3. **Asset Display**
   - Client polls `/api/jobs/[jobId]` for status
   - On COMPLETE, fetches presigned URL from `/api/assets`
   - Displays asset from R2

## Code Conventions

### TypeScript
- Use strict mode
- Prefer `interface` over `type` for objects
- Use `async/await` over `.then()` chains
- Always handle errors with try/catch

### React
- Use `"use client"` directive for client components
- Prefer functional components with hooks
- Use `useState` for local state, not context
- Keep components focused and small

### API Routes
- Always check authentication with `auth()`
- Validate input with Zod schemas
- Return consistent error responses: `{ error: "message" }`
- Use proper HTTP status codes

### Styling
- Use Tailwind CSS classes
- Follow the Mission Control theme (dark mode)
- Use `mc-card` classes for card components
- Colors: teal (#00e5c9), blue (#4a9eff), purple (#b06aff)

## Environment Variables

Required in `.env`:
```env
AUTH_SECRET              # NextAuth secret
DATABASE_URL            # PostgreSQL connection string
ENCRYPTION_KEY          # 64-char hex for AES-256
NEXT_PUBLIC_APP_URL     # App URL (http://localhost:3000)
FAL_WEBHOOK_SECRET      # Optional webhook secret
```

## Database

Uses PostgreSQL with Prisma ORM. Key models:
- `User` - Users with email
- `Credentials` - Encrypted API keys (Fal.ai, R2)
- `Job` - Generation jobs with status tracking

Job statuses: PENDING, PROCESSING, COMPLETE, UPLOAD_FAILED, FAL_FAILED, CANCELLED

## Security

- API keys encrypted with AES-256-GCM before storage
- Webhook signatures validated with HMAC-SHA256
- All API routes require authentication (except webhooks)
- Input validation on all endpoints

## Testing Checklist

See `docs/USER_GUIDE.md` for comprehensive testing procedures.

## Common Issues

### Build Errors
- Ensure all `"use client"` directives are present
- Check that SessionProvider wraps authenticated components
- Verify Prisma schema matches database

### Webhook Issues
- Check FAL_WEBHOOK_SECRET is configured
- Verify webhook URL is accessible from internet
- Check signature validation logic

### R2 Upload Failures
- Verify R2 credentials are correct
- Check bucket permissions
- Ensure endpoint URL is correct format