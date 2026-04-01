/**
 * Image-to-Image Editing Example
 * 
 * This example demonstrates how to use fal.ai's image editing models
 * to transform existing images based on text prompts.
 * 
 * Prerequisites:
 * - Install @fal-ai/client: npm install @fal-ai/client
 * - Set FAL_KEY environment variable with your API key
 */

import { fal } from "@fal-ai/client";

// Configure your API key
fal.config({
  credentials: process.env.FAL_KEY,
});

/**
 * Example 1: Basic Image Editing with Flux 2 Pro Edit
 * Edit a single image using a text prompt
 */
async function basicImageEdit() {
  const result = await fal.subscribe("fal-ai/flux-2-pro/edit", {
    input: {
      prompt: "Place realistic flames emerging from the top of the coffee cup, dancing above the rim",
      image_urls: [
        "https://storage.googleapis.com/falserverless/example_inputs/flux2_pro_edit_input.png"
      ],
      image_size: "auto",
      safety_tolerance: "2",
      enable_safety_checker: true,
      output_format: "jpeg",
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs?.map((log) => log.message).forEach(console.log);
      }
    },
  });

  console.log("Generated image URL:", result.data.images[0].url);
  console.log("Request ID:", result.requestId);
  return result;
}

/**
 * Example 2: Multi-Image Editing with Nano Banana 2
 * Edit multiple images in a single request
 */
async function multiImageEdit() {
  const result = await fal.subscribe("fal-ai/nano-banana-2/edit", {
    input: {
      prompt: "make a photo of the man driving the car down the california coastline",
      num_images: 2,
      aspect_ratio: "1:1",
      output_format: "png",
      safety_tolerance: "4",
      image_urls: [
        "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
        "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"
      ],
      resolution: "1K",
      limit_generations: true,
      seed: 2613536,
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs?.map((log) => log.message).forEach(console.log);
      }
    },
  });

  console.log("Generated images:");
  result.data.images.forEach((image: { url: string }, index: number) => {
    console.log(`  Image ${index + 1}:`, image.url);
  });
  console.log("Request ID:", result.requestId);
  return result;
}

/**
 * Example 3: Using Queue API for Long-Running Jobs
 * Submit a job and check status asynchronously
 */
async function queuedImageEdit() {
  // Submit the job
  const { request_id } = await fal.queue.submit("fal-ai/flux-2-pro/edit", {
    input: {
      prompt: "Transform this image into a watercolor painting style",
      image_urls: [
        "https://example.com/input-image.jpg"
      ],
      image_size: "landscape_16_9",
      output_format: "png",
    },
    webhookUrl: "https://your-app.com/api/webhooks/fal", // Optional: for webhook notifications
  });

  console.log("Job submitted with request ID:", request_id);

  // Check status
  const status = await fal.queue.status("fal-ai/flux-2-pro/edit", {
    requestId: request_id,
    logs: true,
  });

  console.log("Job status:", status.status);

  // Get result when complete
  const result = await fal.queue.result("fal-ai/flux-2-pro/edit", {
    requestId: request_id,
  });

  console.log("Result:", result.data);
  return result;
}

/**
 * Example 4: Advanced Editing with Custom Parameters
 * Use additional parameters for more control
 */
async function advancedImageEdit() {
  const result = await fal.subscribe("fal-ai/flux-2-pro/edit", {
    input: {
      prompt: "Convert this photograph into a vintage sepia-toned image with film grain",
      image_urls: [
        "https://example.com/modern-photo.jpg"
      ],
      image_size: {
        width: 1024,
        height: 768,
      },
      seed: 42,
      safety_tolerance: "3",
      enable_safety_checker: true,
      output_format: "png",
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        console.log("Progress:", update.logs?.length, "log entries");
      }
    },
  });

  return result;
}

/**
 * Example 5: Batch Processing Multiple Images
 * Process multiple images with the same edit prompt
 */
async function batchImageEdit(imageUrls: string[], prompt: string) {
  const results = [];

  for (const imageUrl of imageUrls) {
    const result = await fal.subscribe("fal-ai/flux-2-pro/edit", {
      input: {
        prompt,
        image_urls: [imageUrl],
        output_format: "jpeg",
      },
    });

    results.push({
      input: imageUrl,
      output: result.data.images[0].url,
    });

    console.log(`Processed: ${imageUrl} -> ${result.data.images[0].url}`);
  }

  return results;
}

// Export examples for use
export {
  basicImageEdit,
  multiImageEdit,
  queuedImageEdit,
  advancedImageEdit,
  batchImageEdit,
};

// Run example if executed directly
if (require.main === module) {
  (async () => {
    try {
      console.log("Running basic image edit example...\n");
      await basicImageEdit();
    } catch (error) {
      console.error("Error:", error);
    }
  })();
}