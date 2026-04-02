# FalStudio API Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

All routes except `/api/health` and `/api/webhooks/fal` require a valid NextAuth session cookie.

Unauthenticated requests return:
```json
{ "error": "Unauthorized" }
```
HTTP 401.

---

## Endpoints

### Health Check

**`GET /api/health`**

Auth: Not required

```json
{
  "status": "healthy",
  "timestamp": "2026-04-01T18:00:00.000Z",
  "services": { "database": "connected" }
}
```

Error (503):
```json
{
  "status": "unhealthy",
  "timestamp": "2026-04-01T18:00:00.000Z",
  "services": { "database": "disconnected" },
  "error": "Connection refused"
}
```

---

### Jobs

#### List Jobs

**`GET /api/jobs`**

Auth: Required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | string | — | Job ID for cursor-based pagination |
| `limit` | number | 20 | Items per page (1–100) |
| `type` | string | — | Filter by asset type: `IMAGE` or `VIDEO` |
| `status` | string | — | Filter by status: `PENDING`, `PROCESSING`, `COMPLETE`, `UPLOAD_FAILED`, `FAL_FAILED`, `CANCELLED` |
| `model` | string | — | Filter by Fal.ai model endpoint ID |
| `search` | string | — | Search prompt text (min 3 chars) |

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "status": "COMPLETE",
      "type": "IMAGE",
      "model": "fal-ai/flux-pro/v1.1",
      "prompt": "A beautiful sunset over mountains",
      "negativePrompt": null,
      "seed": 42,
      "params": { "guidance_scale": 3.5 },
      "r2Key": "userId/jobId/jobId.png",
      "fallbackUrl": null,
      "parentId": null,
      "errorMessage": null,
      "createdAt": "2026-04-01T18:00:00.000Z",
      "completedAt": "2026-04-01T18:01:00.000Z"
    }
  ],
  "nextCursor": "uuid-or-null"
}
```

**Examples:**
```bash
# Get 20 most recent jobs
GET /api/jobs

# Images only
GET /api/jobs?type=IMAGE&limit=10

# Only completed jobs (used by AssetPicker gallery tab)
GET /api/jobs?type=IMAGE&status=COMPLETE&limit=50

# Search prompts
GET /api/jobs?search=sunset

# Paginate
GET /api/jobs?cursor=<lastJobId>&limit=20
```

---

#### Get Job

**`GET /api/jobs/:jobId`**

Auth: Required

On localhost, polls Fal.ai for live status if PENDING/PROCESSING. In production, relies on webhooks.

**Response:**
```json
{
  "id": "uuid",
  "status": "COMPLETE",
  "type": "IMAGE",
  "model": "fal-ai/flux-pro/v1.1",
  "prompt": "A beautiful sunset over mountains",
  "negativePrompt": "blurry",
  "seed": 42,
  "params": { "guidance_scale": 3.5, "image_size": "landscape_4_3" },
  "falRequestId": "fal-req-id",
  "r2Key": "userId/jobId/jobId.png",
  "fallbackUrl": null,
  "parentId": null,
  "errorMessage": null,
  "createdAt": "2026-04-01T18:00:00.000Z",
  "completedAt": "2026-04-01T18:01:00.000Z"
}
```

Errors: `404` if not found or belongs to another user.

---

#### Cancel Job

**`PATCH /api/jobs/:jobId`**

Auth: Required

**Request Body:**
```json
{ "action": "cancel" }
```

**Response:**
```json
{ "success": true }
```

Errors: `400` if job is not in PENDING/PROCESSING state, `404` if not found.

---

#### Delete Job

**`DELETE /api/jobs/:jobId`**

Auth: Required

Deletes the job record and its associated R2 asset (if any).

**Response:**
```json
{ "success": true }
```

Errors: `404` if not found.

---

### Generate

**`POST /api/generate`**

Auth: Required

Submit a new generation job to Fal.ai.

**Request Body:**
```json
{
  "model": "fal-ai/flux-pro/v1.1",
  "prompt": "A beautiful sunset over mountains",
  "negativePrompt": "blurry, low quality",
  "seed": 42,
  "params": {
    "guidance_scale": 3.5,
    "image_size": "landscape_4_3",
    "num_inference_steps": 28
  },
  "parentId": "uuid"
}
```

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `model` | string | Yes | Fal.ai model endpoint ID; must exist in model catalog |
| `prompt` | string | Yes | 1–4000 characters |
| `negativePrompt` | string | No | Max 2000 characters |
| `seed` | integer | No | 0–2,147,483,647; omit for random |
| `params` | object | No | All additional model-specific params (snake_case, flat) |
| `parentId` | string | No | UUID of source image job for image-to-video/edit lineage |

**Params passthrough:** The `params` object is merged with the model's `defaultParams` and sent flat to Fal.ai. Keys must match Fal.ai's snake_case param names for the chosen model (e.g. `guidance_scale`, `image_size`, `aspect_ratio`, `duration`, `num_images`).

**Response:**
```json
{
  "jobId": "uuid",
  "status": "PROCESSING"
}
```

**Errors:**
- `400` — invalid input, unknown model, Fal.ai API key not configured
- `401` — not authenticated
- `500` — Fal.ai submission failed

---

### Assets

#### Get Presigned URL

**`GET /api/assets`**

Auth: Required

Returns a 1-hour presigned R2 URL for the job's asset.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | string | Yes | Job UUID |

**Response:**
```json
{
  "url": "https://bucket.account.r2.cloudflarestorage.com/path?X-Amz-Signature=..."
}
```

**Errors:**
- `400` — jobId missing
- `404` — job not found, not complete, or no asset stored

---

#### Upload Asset

**`POST /api/assets/upload`**

Auth: Required

Upload a file to the user's R2 bucket. Used by AssetPicker when the user uploads from their device.

**Request:** `multipart/form-data` with a `file` field.

**Response:**
```json
{
  "url": "https://presigned-r2-url-for-uploaded-file...",
  "r2Key": "userId/uploads/filename.png"
}
```

**Errors:**
- `400` — no file provided or invalid file type
- `400` — R2 credentials not configured

---

### Settings

#### Get Settings

**`GET /api/settings`**

Auth: Required

Returns saved credentials with secrets masked.

**Response:**
```json
{
  "falApiKey": "key-••••••••••••••••",
  "r2AccessKey": "AKIA••••••••••••••••",
  "r2SecretKey": "••••••••••••••••",
  "r2Endpoint": "https://abc123.r2.cloudflarestorage.com",
  "r2BucketName": "my-studio",
  "updatedAt": "2026-04-01T18:00:00.000Z"
}
```

If no credentials saved, all fields are `null`.

---

#### Save Settings

**`POST /api/settings`**

Auth: Required

Save or update credentials. All fields are optional — omit a field to keep the existing value.

**Request Body:**
```json
{
  "falApiKey": "key-...",
  "r2AccessKey": "AKIA...",
  "r2SecretKey": "secret...",
  "r2Endpoint": "https://abc123.r2.cloudflarestorage.com",
  "r2BucketName": "my-studio"
}
```

**Response:**
```json
{
  "success": true,
  "falApiKey": "key-••••••••••••••••",
  "r2AccessKey": "AKIA••••••••••••••••",
  "r2SecretKey": "••••••••••••••••",
  "r2Endpoint": "https://abc123.r2.cloudflarestorage.com",
  "r2BucketName": "my-studio"
}
```

**Errors:** `400` — invalid credentials (e.g. Fal.ai key failed validation, R2 connection failed)

---

### Webhooks

#### Fal.ai Webhook

**`POST /api/webhooks/fal`**

Auth: HMAC-SHA256 signature (not session auth)

Receives job completion events from Fal.ai. This endpoint must be reachable from the internet in production.

**Headers:**
```
x-fal-signature: sha256=<hmac-sha256-hex>
```

Signature is computed over the raw request body using `FAL_WEBHOOK_SECRET`. If `FAL_WEBHOOK_SECRET` is not set, signature validation is skipped (local dev only).

**Request Body:**
```json
{
  "request_id": "fal-request-id",
  "status": "COMPLETED",
  "output": {
    "images": [
      {
        "url": "https://fal.media/files/temp/output.png",
        "content_type": "image/png"
      }
    ],
    "videos": [
      {
        "url": "https://fal.media/files/temp/output.mp4",
        "content_type": "video/mp4"
      }
    ]
  }
}
```

**Processing:**
1. Validates signature (timing-safe comparison)
2. Looks up Job by `request_id` (`falRequestId`)
3. Downloads the output file from Fal.ai's temp URL
4. Uploads to user's R2 bucket at `userId/jobId/jobId.<ext>`
5. Updates Job status to `COMPLETE` (or `UPLOAD_FAILED` / `FAL_FAILED`)

**Response (200):**
```json
{ "message": "Asset uploaded successfully" }
```

**Error Responses:**
- `401` — invalid signature
- `404` — job not found for `request_id`
- `200` (with body) — Fal.ai FAILED status updates Job to `FAL_FAILED`, still returns 200

---

## Error Format

All errors use a consistent format:

```json
{ "error": "Human-readable error message" }
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (e.g. job belongs to another user) |
| 404 | Not found |
| 500 | Internal server error |
| 503 | Service unavailable (health check) |

---

## Complete Generation Flow (curl)

```bash
# 1. Sign in (sets session cookie)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@example.com"

# 2. Submit generation
curl -b cookies.txt -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "fal-ai/flux/schnell",
    "prompt": "A sunset over mountains",
    "params": { "image_size": "landscape_4_3" }
  }'
# Returns: { "jobId": "...", "status": "PROCESSING" }

# 3. Poll for status
curl -b cookies.txt http://localhost:3000/api/jobs/<jobId>
# Returns job with status field

# 4. Get asset URL when COMPLETE
curl -b cookies.txt "http://localhost:3000/api/assets?jobId=<jobId>"
# Returns: { "url": "https://presigned-r2-url..." }

# 5. Use completed image as input for another generation
curl -b cookies.txt -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "fal-ai/kling-video/v2/standard/image-to-video",
    "prompt": "The landscape slowly pans right",
    "params": { "duration": "5", "aspect_ratio": "16:9" },
    "parentId": "<imageJobId>"
  }'
```

---

## Model Catalog Reference

Model IDs are defined in `src/lib/models.ts`. Key examples:

| Category | Model ID |
|----------|----------|
| Text→Image | `fal-ai/flux-pro/v1.1` |
| Text→Image | `fal-ai/flux/dev` |
| Text→Image | `fal-ai/flux/schnell` |
| Text→Image | `fal-ai/recraft-v3` |
| Text→Image | `fal-ai/ideogram/v2` |
| Image→Image | `fal-ai/flux-pro/kontext` |
| Image→Image | `fal-ai/flux-lora` (ControlNet) |
| Image→Image | `fal-ai/flux-pro/v1/fill` |
| Text→Video | `fal-ai/kling-video/v2/standard/text-to-video` |
| Text→Video | `fal-ai/kling-video/v2/pro/text-to-video` |
| Text→Video | `fal-ai/luma-dream-machine/ray-2` |
| Image→Video | `fal-ai/kling-video/v2/standard/image-to-video` |
| Image→Video | `fal-ai/stable-video` |
| Upscale | `fal-ai/aura-sr` |
| Upscale | `fal-ai/clarity-upscaler` |
| Edit | `fal-ai/bria/background/remove` |
| Audio | `fal-ai/kokoro` |
| Music | `fal-ai/stable-audio` |

Use `GET /api/jobs?model=fal-ai/flux-pro/v1.1` to filter jobs by model.
