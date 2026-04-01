# FalStudio API Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API routes (except `/api/health` and `/api/webhooks/fal`) require authentication via NextAuth session cookies.

---

## Endpoints

### Health Check

Check server and database status.

**Endpoint:** `GET /api/health`

**Authentication:** Not required

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-01T18:00:00.000Z",
  "services": {
    "database": "connected"
  }
}
```

**Error Response (503):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-04-01T18:00:00.000Z",
  "services": {
    "database": "disconnected"
  },
  "error": "Connection refused"
}
```

---

### Jobs

#### List Jobs

Get paginated list of user's jobs.

**Endpoint:** `GET /api/jobs`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cursor | string | Job ID for pagination |
| limit | number | Items per page (1-100, default: 20) |
| type | string | Filter by type: `IMAGE` or `VIDEO` |
| model | string | Filter by model ID |
| search | string | Search prompts (min 3 chars) |

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "status": "COMPLETE",
      "type": "IMAGE",
      "model": "fal-ai/flux-pro",
      "prompt": "A beautiful sunset",
      "r2Key": "userId/jobId/jobId.png",
      "parentId": null,
      "errorMessage": null,
      "createdAt": "2026-04-01T18:00:00.000Z",
      "completedAt": "2026-04-01T18:01:00.000Z"
    }
  ],
  "nextCursor": "uuid-or-null"
}
```

#### Get Job Details

Get details of a specific job.

**Endpoint:** `GET /api/jobs/:jobId`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| jobId | string | Job UUID |

**Response:**
```json
{
  "id": "uuid",
  "status": "COMPLETE",
  "type": "IMAGE",
  "model": "fal-ai/flux-pro",
  "prompt": "A beautiful sunset",
  "negativePrompt": "blurry",
  "seed": 12345,
  "params": {},
  "r2Key": "userId/jobId/jobId.png",
  "fallbackUrl": null,
  "errorMessage": null,
  "createdAt": "2026-04-01T18:00:00.000Z",
  "completedAt": "2026-04-01T18:01:00.000Z"
}
```

**Error Responses:**
- `404`: Job not found

#### Delete Job

Delete a job and its associated asset.

**Endpoint:** `DELETE /api/jobs/:jobId`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| jobId | string | Job UUID |

**Response:**
```json
{
  "success": true
}
```

**Error Responses:**
- `404`: Job not found

---

### Generate

Submit a new generation job.

**Endpoint:** `POST /api/generate`

**Authentication:** Required

**Request Body:**
```json
{
  "model": "fal-ai/flux-pro",
  "prompt": "A beautiful sunset over mountains",
  "negativePrompt": "blurry, low quality",
  "seed": 12345,
  "params": {
    "guidance_scale": 7.5
  },
  "parentId": "uuid-for-image-to-video"
}
```

**Validation:**
- `model`: Required, must be a valid model ID
- `prompt`: Required, 1-4000 characters
- `negativePrompt`: Optional, max 2000 characters
- `seed`: Optional, integer 0-2147483647
- `params`: Optional, object with model-specific parameters
- `parentId`: Optional, UUID of parent job for image-to-video

**Response:**
```json
{
  "jobId": "uuid",
  "status": "PROCESSING"
}
```

**Error Responses:**
- `400`: Invalid input, invalid model, or Fal.ai API key not configured
- `401`: Unauthorized

---

### Assets

Get presigned URL for an asset.

**Endpoint:** `GET /api/assets`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| jobId | string | Job UUID |

**Response:**
```json
{
  "url": "https://bucket.r2.cloudflarestorage.com/path?signature..."
}
```

**Error Responses:**
- `400`: jobId required
- `404`: Job not found or asset not available

---

### Settings

#### Get Settings

Get user's current settings (credentials masked).

**Endpoint:** `GET /api/settings`

**Authentication:** Required

**Response:**
```json
{
  "falApiKey": "sk-••••••••••••••••",
  "r2AccessKey": "AKIA••••••••••••••••",
  "r2SecretKey": "••••••••••••••••",
  "r2Endpoint": "https://xxx.r2.cloudflarestorage.com",
  "r2BucketName": "my-bucket",
  "updatedAt": "2026-04-01T18:00:00.000Z"
}
```

#### Update Settings

Save or update user credentials.

**Endpoint:** `POST /api/settings`

**Authentication:** Required

**Request Body:**
```json
{
  "falApiKey": "sk-...",
  "r2AccessKey": "AKIA...",
  "r2SecretKey": "secret...",
  "r2Endpoint": "https://xxx.r2.cloudflarestorage.com",
  "r2BucketName": "my-bucket"
}
```

**Validation:**
- `falApiKey`: Optional, validated via test API call
- `r2AccessKey`: Optional, required if other R2 fields provided
- `r2SecretKey`: Optional, required if other R2 fields provided
- `r2Endpoint`: Optional, must be valid URL
- `r2BucketName`: Optional, 1-63 characters

**Response:**
```json
{
  "success": true,
  "falApiKey": "sk-••••••••••••••••",
  "r2AccessKey": "AKIA••••••••••••••••",
  "r2SecretKey": "••••••••••••••••",
  "r2Endpoint": "https://xxx.r2.cloudflarestorage.com",
  "r2BucketName": "my-bucket"
}
```

**Error Responses:**
- `400`: Invalid credentials or validation failed

---

### Webhooks

#### Fal.ai Webhook

Receive job completion notifications from Fal.ai.

**Endpoint:** `POST /api/webhooks/fal`

**Authentication:** Webhook signature (HMAC-SHA256)

**Headers:**
```
x-fal-signature: <hmac-signature>
```

**Request Body:**
```json
{
  "request_id": "fal-request-id",
  "status": "COMPLETED",
  "output": {
    "images": [
      {
        "url": "https://fal.ai/temp-url.png",
        "contentType": "image/png"
      }
    ]
  }
}
```

**Status Values:**
- `COMPLETED`: Generation successful
- `FAILED`: Generation failed
- `IN_PROGRESS`: Still processing

**Response:**
```json
{
  "message": "Asset uploaded successfully"
}
```

---

## Error Handling

All endpoints return errors in the format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request / Validation error |
| 401 | Unauthorized |
| 404 | Not found |
| 500 | Internal server error |
| 503 | Service unavailable |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

---

## Examples

### Complete Generation Flow

```bash
# 1. Sign in (get session cookie)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -d "email=test@example.com"

# 2. Submit generation
curl -b cookies.txt -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"fal-ai/flux/schnell","prompt":"A cat"}'

# 3. Poll for status
curl -b cookies.txt http://localhost:3000/api/jobs/[jobId]

# 4. Get asset URL when complete
curl -b cookies.txt "http://localhost:3000/api/assets?jobId=[jobId]"
```

### List with Filters

```bash
# Get only images
curl -b cookies.txt "http://localhost:3000/api/jobs?type=IMAGE&limit=10"

# Search prompts
curl -b cookies.txt "http://localhost:3000/api/jobs=search=sunset"