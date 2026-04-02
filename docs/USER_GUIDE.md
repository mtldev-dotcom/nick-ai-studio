# FalStudio User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Initial Setup](#initial-setup)
3. [Generation Studio](#generation-studio)
4. [Dynamic Parameters](#dynamic-parameters)
5. [Asset Reuse](#asset-reuse)
6. [Gallery](#gallery)
7. [Settings](#settings)
8. [Mobile Usage](#mobile-usage)
9. [Troubleshooting](#troubleshooting)
10. [Testing Checklist](#testing-checklist)

---

## Getting Started

### Prerequisites

- **Fal.ai API Key** — [fal.ai/dashboard](https://fal.ai/dashboard)
- **Cloudflare R2 Bucket** — [dash.cloudflare.com](https://dash.cloudflare.com)
- R2 Access Key ID, Secret Access Key, Endpoint URL, and Bucket Name

### First Launch

1. Open `http://localhost:3000`
2. Enter any email address — no password required, auto-creates account
3. You'll land on the **Gallery** page (empty on first run)
4. Go to **Settings** and enter your credentials before generating

---

## Initial Setup

### Configure Settings

1. Navigate to **Settings** (top nav on desktop, bottom tab on mobile)
2. Enter your **Fal.ai API Key** (`key-...` or `fal-...` format) — validated on save
3. Enter your **Cloudflare R2** credentials:
   - **Endpoint URL**: `https://[account-id].r2.cloudflarestorage.com`
   - **Bucket Name**: your R2 bucket name
   - **Access Key ID** and **Secret Access Key**
4. Click **Save Settings** — you'll see a success toast

Credentials are stored encrypted with AES-256-GCM and never exposed to the browser.

---

## Generation Studio

Navigate to **Generate** (the `+` button on mobile, or **Generate** in the desktop header).

### Layout

**Desktop (2-column):**
```
┌─────────────────┬──────────────────────────┐
│  Model Browser  │  Parameters              │
│  (left panel)   │  [dynamic form]          │
│                 │                          │
│  Search...      │  Generate ▶             │
│  [type tabs]    │                          │
│  Model cards    │                          │
└─────────────────┴──────────────────────────┘
```

**Mobile (single column, accordion):**
```
┌──────────────────────┐
│  ▼ Selected Model    │  ← tap to expand model browser
│  Flux 1.1 Pro        │
├──────────────────────┤
│  Parameters          │
│  [dynamic form]      │
│  Generate ▶         │
└──────────────────────┘
```

### Selecting a Model

1. Use the **search box** to filter by name or keyword
2. Use the **type filter tabs** to narrow by category:
   - Text→Image · Image→Image · Text→Video · Image→Video
   - Upscale · Edit · Audio · Music
3. Click a model card to select it — the parameter form updates immediately

### Submitting a Generation

1. Fill in the required parameters (marked with `*`)
2. Click **Generate**
3. The studio shows a progress state with status polling
4. On completion: the result preview appears inline; the asset is saved to R2
5. Click **View in Gallery** to see it in the full gallery

---

## Dynamic Parameters

Each model exposes only the parameters it actually supports. Parameter types:

| Type | Control | Example |
|------|---------|---------|
| `textarea` | Multi-line text box | Prompt, Negative Prompt |
| `slider` | Range slider with value | Guidance Scale (1–20), Steps |
| `select` | Dropdown | Output Format (png/jpeg/webp) |
| `toggle` | iOS-style switch | Enable Safety Checker |
| `size-picker` | Visual grid of sizes | Image Size (square/portrait/landscape) |
| `aspect-ratio` | Pill buttons | Aspect Ratio (16:9, 1:1, 9:16...) |
| `image-upload` | AssetPicker (single) | Input Image for img2img |
| `images-upload` | AssetPicker (multi) | Reference Images for IP-Adapter |
| `number` | Number input | Seed |

### Seed

- Leave blank or `0` for a random seed
- Set a specific integer for reproducible results
- The seed used is shown in job details

### Image Size / Aspect Ratio

- `size-picker` shows visual rectangle previews for each preset
- `aspect-ratio` shows labeled pill buttons (e.g. `16:9`, `1:1`, `9:16`, `4:3`)
- Video models typically use `aspect-ratio`; image models use `size-picker`

---

## Asset Reuse

### Using a Gallery Image as Input

Any method works for image-to-image, image-to-video, upscale, and edit models:

**From Gallery:**
1. Find a completed image in **Gallery**
2. Hover (desktop) or long-press (mobile) to reveal actions
3. Click **Use as Input** — navigates to Generate with the image pre-loaded

**From the AssetPicker inside Generate:**
1. Select a model that has an image input (e.g. Flux ControlNet, Kling I2V)
2. The image parameter shows an `AssetPicker` with two tabs:
   - **Upload File** — drag-drop, click to browse, or paste from clipboard
   - **From Gallery** — grid of your completed images; click to select
3. Selected image shows with a checkmark; confirm and proceed

### Uploading a New Image

In the **Upload File** tab of AssetPicker:
- Drag and drop an image onto the zone
- Or click the zone to open a file picker
- Or paste (`Ctrl+V` / `Cmd+V`) an image from clipboard
- Supported: PNG, JPEG, WebP, GIF
- File is uploaded to your R2 bucket and the presigned URL is used as input

---

## Gallery

### Browsing Assets

- Assets are shown in a masonry-style grid, newest first
- Videos show a play icon overlay; hover to start playback
- Images show a preview with prompt excerpt on hover

### Filtering and Search

- **All / Images / Videos** — type filter tabs at the top
- **Search box** — searches prompt text (3+ characters to activate)
- Filters and search combine (e.g. Images + "sunset")

### Asset Actions

**Desktop (hover overlay):**
- Copy Prompt, Use as Input, Download, Delete

**Mobile (long-press context menu):**
- Same actions, touch-friendly with 44px minimum tap targets

### Asset Status Indicators

| Status | Meaning |
|--------|---------|
| PENDING | Queued at Fal.ai |
| PROCESSING | Generating |
| COMPLETE | Done, visible in gallery |
| UPLOAD_FAILED | Generated but R2 upload failed |
| FAL_FAILED | Generation failed at Fal.ai |
| CANCELLED | Manually cancelled |

### Load More

The gallery loads 20 items at a time. Scroll to the bottom and click **Load more** to fetch the next page.

---

## Settings

### Updating Credentials

- Navigate to **Settings**
- Fields show masked values (`••••••••`) when credentials are saved
- Enter a new value to replace it; leave blank to keep the existing one
- **Save Settings** validates credentials before storing

### Rotating Credentials

If you change your `ENCRYPTION_KEY` environment variable, all stored credentials become unreadable. Re-enter them in Settings after any key rotation.

---

## Mobile Usage

### Navigation

On screens narrower than `768px` (tablet/phone):
- A **bottom tab bar** replaces the desktop header navigation
- Tabs: **Gallery** | **Generate** (center, raised teal button) | **Settings**
- A minimal header shows the logo and a settings icon only

### Safe Area

The app uses `env(safe-area-inset-bottom)` to ensure the bottom nav clears the iPhone home indicator on notched devices.

### Touch Interactions

- **Tap** a gallery card to open the full-screen preview
- **Long-press** (500ms hold) a gallery card to open the context menu
- All interactive elements have a minimum 44×44px touch target
- The generate form is scrollable; the model browser collapses into an accordion on mobile

---

## Troubleshooting

### "Fal.ai API key not configured"
Go to Settings and enter your key. Keys starting with `key-` or `fal-` are supported.

### Generation stuck on PROCESSING
The webhook is not reaching your server. On localhost:
1. Install [ngrok](https://ngrok.com) or use [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
2. Set `NEXT_PUBLIC_APP_URL` in `.env` to your public tunnel URL
3. Restart the dev server

### "Invalid signature" on webhook
- Verify `FAL_WEBHOOK_SECRET` in `.env` matches what you set in the Fal.ai dashboard
- If unset, webhook accepts all payloads (acceptable for local dev, not for production)

### R2 images not loading after an hour
Presigned URLs expire after 1 hour. Refresh the page or re-open Gallery to get fresh URLs. This is a known limitation.

### Gallery shows broken image icons
- The job may be in UPLOAD_FAILED state — R2 upload failed after generation
- Check that R2 credentials are correct and bucket permissions allow `PutObject`
- CORS must allow your app's domain if loading directly

### Build errors
- Ensure all `"use client"` directives are present in client components
- Run `npx prisma generate` if you get Prisma type errors
- Run `npm run lint` and fix any ESLint errors before building

### Database issues
```bash
npx prisma db push        # first-time setup (no migration history)
npx prisma migrate deploy # subsequent deploys
npx prisma studio         # browse data at localhost:5555
```

---

## Testing Checklist

### Authentication
- [ ] Sign in with email creates account
- [ ] Session persists on page refresh
- [ ] Sign out works
- [ ] Unauthenticated requests to `/api/*` return 401

### Settings
- [ ] Can save Fal.ai API key — validated on save
- [ ] Can save R2 credentials
- [ ] Saved values shown masked; not exposed in response
- [ ] Invalid API key shows error toast

### Image Generation (Text → Image)
- [ ] Select Flux 1.1 Pro model
- [ ] Set prompt, adjust guidance_scale slider, set image_size
- [ ] Click Generate
- [ ] Status transitions: PENDING → PROCESSING → COMPLETE
- [ ] Image appears in Gallery on completion
- [ ] Seed field reflects actual seed used

### Video Generation (Text → Video)
- [ ] Select Kling v2 Standard model
- [ ] Enter motion prompt, set duration and aspect ratio
- [ ] Generation completes and video appears in Gallery

### Image-to-Video
- [ ] Go to Gallery, hover an image, click **Use as Input**
- [ ] Generate page opens with image pre-loaded in first image-upload field
- [ ] Select a video model (e.g. Kling v2 I2V)
- [ ] Generate produces a video from the source image

### AssetPicker
- [ ] Upload tab: drag-drop an image, confirm it uploads to R2
- [ ] Upload tab: paste image from clipboard works
- [ ] Gallery tab: shows completed images, click to select
- [ ] Selected image has checkmark; value passed to form

### Gallery
- [ ] All / Images / Videos filter tabs work
- [ ] Search filters by prompt (min 3 chars)
- [ ] Copy Prompt copies to clipboard, toast appears
- [ ] Download saves file locally
- [ ] Delete removes card with toast confirmation
- [ ] Long-press on mobile opens context menu
- [ ] **Use as Input** navigates to Generate with `?inputImage=` param

### Mobile (375px viewport)
- [ ] Bottom nav visible and functional
- [ ] Generate accordion collapses/expands model browser
- [ ] Dynamic form scrollable
- [ ] Long-press context menu appears on gallery cards
- [ ] Touch targets ≥ 44px throughout

### Security Headers
- [ ] `X-Frame-Options: SAMEORIGIN` present on page responses
- [ ] `Strict-Transport-Security` present in production
- [ ] `Content-Security-Policy` present
- [ ] `X-Content-Type-Options: nosniff` present
