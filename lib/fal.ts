/**
 * Fal.ai HTTP client for prank video generation using Seedance 2.0 Mini.
 * Uses FAL_KEY from env to call Fal.ai REST API directly.
 *
 * Model: fal-ai/seedance-2/mini/reference-to-video
 * Input: image + text prompt → output: video with audio
 *
 * Cost-optimized: 480p, 5 second duration, no audio.
 */

const FAL_BASE = "https://queue.fal.run";
const STORAGE_BASE = "https://rest.fal.ai/storage";
const FAL_KEY = process.env.FAL_KEY || "";
const FAL_MODEL = "fal-ai/seedance-2/mini/reference-to-video";

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Key ${FAL_KEY}`,
    "Content-Type": "application/json",
  };
}

function requireFalKey(): void {
  if (!FAL_KEY || FAL_KEY.length < 10) {
    throw new Error(
      "FAL_KEY environment variable is not configured or is too short. " +
      "Go to Vercel → Settings → Environment Variables and add FAL_KEY " +
      "with your fal.ai API key (format: KEY_ID:KEY_SECRET)."
    );
  }
}

/**
 * Upload a base64 image to fal.ai CDN and return its URL.
 */
export async function uploadImage(base64DataUri: string): Promise<string> {
  requireFalKey();

  const match = base64DataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URI");

  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
  const ext = contentType.split("/")[1] || "png";

  const initRes = await fetch(`${STORAGE_BASE}/upload/initiate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ content_type: contentType, file_name: `selfie.${ext}` }),
  });

  if (!initRes.ok) {
    const text = await initRes.text();
    throw new Error(`Fal upload initiate failed: ${initRes.status} ${text}`);
  }

  const { upload_url, file_url } = await initRes.json();

  const uploadRes = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Fal upload PUT failed: ${uploadRes.status} ${text}`);
  }

  return file_url;
}

/**
 * Submit a Seedance 2.0 Mini generation request.
 * Uses cheapest settings: 480p, 5 seconds, no audio.
 */
export async function submitVideoGeneration(
  prompt: string,
  imageUrl: string
): Promise<string> {
  requireFalKey();

  const response = await fetch(`${FAL_BASE}/${FAL_MODEL}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      prompt,
      image_urls: [imageUrl],
      duration: "5",
      resolution: "480p",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fal generation failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.request_id;
}

/**
 * Poll for a completed video result.
 */
export async function pollForVideoResult(
  requestId: string,
  maxRetries = 60,
  intervalMs = 2000
): Promise<{ videoUrl: string }> {
  const statusUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}/status`;
  const resultUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}`;

  for (let i = 0; i < maxRetries; i++) {
    const statusRes = await fetch(statusUrl, { headers: getHeaders() });

    if (!statusRes.ok) {
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }

    const statusData = await statusRes.json();

    if (statusData.status === "COMPLETED") {
      for (let r = 0; r < 10; r++) {
        const resultRes = await fetch(resultUrl, { headers: getHeaders() });

        if (resultRes.ok) {
          const resultData = await resultRes.json();
          const videoUrl = resultData.video?.url || "";
          if (videoUrl) return { videoUrl };
        }

        await new Promise((r) => setTimeout(r, 2000));
      }

      throw new Error("Fal result fetch failed after retries");
    }

    if (statusData.status === "FAILED" || statusData.status === "ERROR") {
      throw new Error("Fal generation failed");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("Fal generation timed out");
}