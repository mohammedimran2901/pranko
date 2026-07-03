/**
 * Fal.ai HTTP client for prank photo generation.
 * Uses FAL_KEY from env to call Fal.ai REST API directly.
 *
 * Model: fal-ai/flux-pulid — face-preserving portrait generation
 * using PuLID technology on top of FLUX.
 */

const FAL_BASE = "https://queue.fal.run";
const FAL_STORAGE = "https://rest.fal.ai/storage";
const FAL_KEY = process.env.FAL_KEY || "";
const FAL_MODEL = "fal-ai/flux-pulid";

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Key ${FAL_KEY}`,
    "Content-Type": "application/json",
  };
}

function requireFalKey(): void {
  if (!FAL_KEY || FAL_KEY.length < 10) {
    throw new Error(
      "FAL_KEY environment variable is not configured. " +
      "Set it in your .env.local or Vercel environment variables."
    );
  }
}

export async function uploadToFal(base64DataUri: string): Promise<string> {
  requireFalKey();

  const match = base64DataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URI");

  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  const fileExt = contentType.split("/")[1] || "png";
  const initRes = await fetch(`${FAL_STORAGE}/upload/initiate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      content_type: contentType,
      file_name: `selfie.${fileExt}`,
    }),
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

export async function submitGeneration(
  prompt: string,
  uploadedImageUrl: string
): Promise<string> {
  requireFalKey();

  const url = `${FAL_BASE}/${FAL_MODEL}`;

  const body = {
    prompt,
    reference_image_url: uploadedImageUrl,
    image_size: "portrait_4_3",
    num_inference_steps: 30,
    guidance_scale: 4,
    id_weight: 0.85,
    enable_safety_checker: true,
    negative_prompt: "cartoon, anime, 3d render, low quality, blurry, distorted face, deformed features, nsfw, nudity",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fal generation failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.request_id;
}

export async function pollForResult(
  requestId: string,
  maxRetries = 90,
  intervalMs = 2000
): Promise<string> {
  const statusUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}/status`;
  const resultUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}`;

  for (let i = 0; i < maxRetries; i++) {
    const statusRes = await fetch(statusUrl, {
      headers: getHeaders(),
    });

    if (!statusRes.ok) {
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }

    const statusData = await statusRes.json();

    if (statusData.status === "COMPLETED") {
      for (let r = 0; r < 5; r++) {
        const resultRes = await fetch(resultUrl, {
          headers: getHeaders(),
        });

        if (resultRes.ok) {
          const resultData = await resultRes.json();
          return resultData.images?.[0]?.url || "";
        }

        await new Promise((r) => setTimeout(r, 1000));
      }

      throw new Error(`Fal result fetch failed after retries`);
    }

    if (statusData.status === "FAILED" || statusData.status === "ERROR") {
      throw new Error("Fal generation failed");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("Fal generation timed out");
}
