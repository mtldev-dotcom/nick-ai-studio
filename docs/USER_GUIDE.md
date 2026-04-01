# FalStudio User Guide & Testing Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [Initial Setup](#initial-setup)
3. [Generating Images](#generating-images)
4. [Generating Videos](#generating-videos)
5. [Image-to-Video](#image-to-video)
6. [Managing Assets](#managing-assets)
7. [Settings & Credentials](#settings--credentials)
8. [API Testing](#api-testing)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

Before using FalStudio, ensure you have:

1. **Fal.ai API Key** - Get from [fal.ai/dashboard](https://fal.ai/dashboard)
2. **Cloudflare R2 Bucket** - Create at [dash.cloudflare.com](https://dash.cloudflare.com)
3. **R2 Credentials** - Access Key ID and Secret Access Key

### First Launch

1. Open the application at `http://localhost:3000`
2. You'll see the landing page with "Sign In to Start"
3. Enter any email address to create an account (no password required)
4. You'll be redirected to the Gallery page

---

## Initial Setup

### Step 1: Configure Settings

1. Click **Settings** in the navigation bar
2. Enter your **Fal.ai API Key**
   - Format: `sk-...` or `fal-...`
   - The key will be validated before saving
3. Enter your **Cloudflare R2 Credentials**:
   - **Endpoint URL**: `https://[account-id].r2.cloudflarestorage.com`
   - **Bucket Name**: Your R2 bucket name
   - **Access Key ID**: Your R2 access key
   - **Secret Access Key**: Your R2 secret key
4. Click **Save Settings**
5. You should see "Settings saved successfully!"

### Step 2: Verify Configuration

1. Go to the **Generate** page
2. Try creating a simple image generation
3. If successful, your credentials are working correctly

---

## Generating Images

### Basic Image Generation

1. Navigate to **Generate** page
2. Select **Image** as the asset type
3. Choose a **Category** (Flux, Stable Diffusion, etc.)
4. Select a **Model** from the dropdown
5. Enter a **Prompt** describing what you want to generate
6. Optionally add a **Negative Prompt** to exclude elements
7. Optionally set a **Seed** for reproducibility
8. Click **Generate**

### Recommended Prompts

**Flux Models:**
```
A majestic mountain landscape at sunset, golden hour lighting, 
photorealistic, 8k resolution, highly detailed
```

**Stable Diffusion:**
```
Portrait of a cyberpunk warrior, neon lights, rain, 
detailed face, cinematic lighting, trending on artstation
```

**Recraft v3:**
```
Modern minimalist logo design, clean lines, 
professional branding, vector style
```

### Monitoring Generation

1. After clicking Generate, a modal shows "Generating..."
2. The modal polls for status every 3 seconds
3. When complete, you'll see "Generation Complete!"
4. Click "View in Gallery" to see your asset

---

## Generating Videos

### Text-to-Video

1. Navigate to **Generate** page
2. Select **Video** as the asset type
3. Choose a video model (Kling, Luma, MiniMax, etc.)
4. Enter a detailed prompt describing the motion
5. Click **Generate**

### Video Prompt Tips

- Describe motion explicitly: "Camera slowly pans left"
- Include scene details: "A cat walking through a garden"
- Specify duration preferences if supported

---

## Image-to-Video

### Converting Images to Videos

1. Go to **Gallery** page
2. Find a completed image asset
3. Hover over the image card
4. Click **Make Video** button
5. The Generation Modal opens with the image pre-selected
6. Choose a video model
7. Adjust the prompt if needed
8. Click **Generate**

### Best Practices

- Use high-quality source images
- Ensure the image has clear subjects
- Videos work best with 5-10 second durations

---

## Managing Assets

### Gallery Features

**Viewing Assets:**
- All generated assets appear in the Gallery
- Images show thumbnails
- Videos show animated previews on hover

**Filtering:**
- Click **All** to show everything
- Click **Images** to filter images only
- Click **Videos** to filter videos only

**Searching:**
- Type in the search box (minimum 3 characters)
- Searches through prompts
- Results update as you type

### Asset Actions

**Right-click or hover on an asset to:**

1. **Copy Prompt** - Copy the generation prompt to clipboard
2. **Make Video** - (Images only) Generate video from image
3. **Download** - Download the asset file
4. **Delete** - Remove the asset permanently

### Asset Status

| Status | Description |
|--------|-------------|
| PENDING | Job queued, waiting to start |
| PROCESSING | Currently generating |
| COMPLETE | Successfully generated |
| FAL_FAILED | Generation failed at Fal.ai |
| UPLOAD_FAILED | Generated but R2 upload failed |

---

## Settings & Credentials

### Updating Credentials

1. Go to **Settings** page
2. Enter new values in any field
3. Leave fields blank to keep existing values
4. Click **Save Settings**

### Credential Validation

- **Fal.ai Key**: Validated by making a test API call
- **R2 Credentials**: Validated by checking bucket access
- Invalid credentials will show an error message

### Security Notes

- All credentials are encrypted with AES-256-GCM
- Keys are never exposed to the browser
- Each user has isolated credentials

---

## API Testing

### Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-01T18:00:00.000Z",
  "services": {
    "database": "connected"
  }
}
```

### List Jobs

```bash
curl -b "cookies.txt" http://localhost:3000/api/jobs?limit=10
```

### Get Job Details

```bash
curl -b "cookies.txt" http://localhost:3000/api/jobs/[jobId]
```

### Submit Generation

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{
    "model": "fal-ai/flux-pro",
    "prompt": "A beautiful sunset over mountains"
  }'
```

### Get Asset URL

```bash
curl -b "cookies.txt" "http://localhost:3000/api/assets?jobId=[jobId]"
```

---

## Troubleshooting

### Common Issues

**"Fal.ai API key not configured"**
- Go to Settings and enter your Fal.ai API key
- Ensure the key is valid and has credits

**"R2 credentials not configured"**
- Go to Settings and enter all R2 fields
- Verify the endpoint URL format is correct
- Check bucket permissions

**Generation stuck on "PROCESSING"**
- Check Fal.ai dashboard for job status
- The webhook may not be reaching your server
- Verify NEXT_PUBLIC_APP_URL is correct

**"Invalid signature" webhook error**
- Check FAL_WEBHOOK_SECRET in .env
- Ensure it matches Fal.ai dashboard setting

**Assets not loading in Gallery**
- Check browser console for errors
- Verify R2 credentials are correct
- Check bucket CORS settings

### Debug Mode

Enable detailed logging by checking:
1. Browser console (F12 → Console)
2. Server logs in terminal
3. Prisma logs: `DEBUG="prisma:*" npm run dev`

### Reset Database

```bash
npx prisma migrate reset
npx prisma migrate deploy
```

### Clear Browser Data

1. Open DevTools (F12)
2. Application → Storage → Clear site data
3. Refresh the page

---

## Testing Checklist

### Authentication
- [ ] Can sign in with email
- [ ] Session persists on refresh
- [ ] Can sign out
- [ ] Protected routes redirect to sign-in

### Settings
- [ ] Can save Fal.ai API key
- [ ] Can save R2 credentials
- [ ] Invalid credentials show error
- [ ] Credentials are masked in UI

### Image Generation
- [ ] Can select image type
- [ ] Can choose category and model
- [ ] Can enter prompt
- [ ] Generation starts successfully
- [ ] Status updates in real-time
- [ ] Completed image appears in gallery

### Video Generation
- [ ] Can select video type
- [ ] Can choose video model
- [ ] Generation completes
- [ ] Video appears in gallery

### Image-to-Video
- [ ] "Make Video" button appears on images
- [ ] Modal opens with image pre-selected
- [ ] Video generation works

### Gallery
- [ ] Assets load correctly
- [ ] Filtering works (All/Images/Videos)
- [ ] Search works (min 3 chars)
- [ ] Load more pagination works
- [ ] Can copy prompt
- [ ] Can download asset
- [ ] Can delete asset
- [ ] Toast notifications appear

### API Endpoints
- [ ] Health check returns 200
- [ ] Jobs list returns data
- [ ] Job detail returns single job
- [ ] Asset URL returns presigned URL

---

## Performance Tips

1. **Use smaller models for testing** - Flux Schnell is fastest
2. **Set seeds for reproducibility** - Same seed = same result
3. **Filter gallery** - Reduces data transfer
4. **Use search** - Faster than scrolling

---

## Support

For issues or questions:
1. Check this guide first
2. Review CLAUDE.md for technical details
3. Check browser console for errors
4. Review server logs for backend issues